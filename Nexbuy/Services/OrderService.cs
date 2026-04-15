using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Orders;
using Nexbuy.Helpers;
using Nexbuy.Middleware;
using Nexbuy.Models;
using Nexbuy.Models.Enums;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services;

public class OrderService : IOrderService
{
    private readonly NexbuyDbContext _db;
    private readonly ICartService _cartService;
    private static readonly Random _random = new();

    public OrderService(NexbuyDbContext db, ICartService cartService)
    {
        _db = db;
        _cartService = cartService;
    }

    public async Task<OrderDetailDto> CreateOrderAsync(Guid userId, CreateOrderRequest request)
    {
        var cartId = userId.ToString();
        var cart = await _cartService.GetCartAsync(cartId);

        if (cart.Items.Count == 0)
            throw new BusinessException("Cart is empty.", "CART_EMPTY");

        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new BusinessException("User not found.", "USER_NOT_FOUND", 404);

            // Resolve shipping address if provided
            string recipientName = request.RecipientName ?? "";
            string recipientPhone = request.RecipientPhone ?? "";
            string? shippingAddress = request.ShippingAddress;
            string? storeId = request.StoreId;

            if (request.ShippingAddressId.HasValue)
            {
                var addr = await _db.UserAddresses.FirstOrDefaultAsync(a =>
                    a.Id == request.ShippingAddressId.Value && a.UserId == userId);
                if (addr != null)
                {
                    recipientName = addr.RecipientName;
                    recipientPhone = addr.Phone;
                    shippingAddress = addr.Address != null
                        ? $"{addr.ZipCode} {addr.City} {addr.Address}"
                        : null;
                    storeId = addr.StoreId;
                }
            }

            // Validate stock and build order items
            var orderItems = new List<OrderItem>();
            decimal subTotal = 0;

            foreach (var cartItem in cart.Items)
            {
                var product = await _db.Products
                    .Include(p => p.Variants)
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.Id == cartItem.ProductId);

                if (product == null)
                    throw new BusinessException($"Product not found: {cartItem.ProductName}", "PRODUCT_NOT_FOUND");

                int availableStock;
                decimal unitPrice;
                ProductVariant? variant = null;

                if (cartItem.VariantId.HasValue)
                {
                    variant = product.Variants.FirstOrDefault(v => v.Id == cartItem.VariantId.Value);
                    if (variant == null)
                        throw new BusinessException($"Variant not found for {cartItem.ProductName}", "VARIANT_NOT_FOUND");
                    availableStock = variant.Stock;
                    unitPrice = product.Price + variant.PriceAdjustment;
                }
                else
                {
                    availableStock = product.Stock;
                    unitPrice = product.Price;
                }

                if (cartItem.Quantity > availableStock)
                    throw new BusinessException(
                        $"Insufficient stock for {cartItem.ProductName}.",
                        "PRODUCT_OUT_OF_STOCK");

                // Deduct stock
                if (variant != null)
                    variant.Stock -= cartItem.Quantity;
                else
                    product.Stock -= cartItem.Quantity;

                var itemSubtotal = unitPrice * cartItem.Quantity;
                subTotal += itemSubtotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = cartItem.ProductId,
                    VariantId = cartItem.VariantId,
                    ProductName = cartItem.ProductName,
                    UnitPrice = unitPrice,
                    Quantity = cartItem.Quantity,
                    Subtotal = itemSubtotal
                });
            }

            // Coupon discount
            decimal couponDiscount = 0;
            Coupon? appliedCoupon = null;
            if (!string.IsNullOrEmpty(cart.CouponCode))
            {
                appliedCoupon = await _db.Coupons.FirstOrDefaultAsync(c =>
                    c.Code == cart.CouponCode &&
                    c.Status == CouponStatus.Active &&
                    c.StartAt <= DateTime.UtcNow &&
                    c.ExpiredAt > DateTime.UtcNow);

                if (appliedCoupon != null)
                {
                    if (appliedCoupon.UsageLimit.HasValue && appliedCoupon.UsedCount >= appliedCoupon.UsageLimit.Value)
                        throw new BusinessException("Coupon usage limit reached.", "COUPON_LIMIT_REACHED");

                    if (subTotal < appliedCoupon.MinOrderAmount)
                        throw new BusinessException("Order does not meet minimum amount for coupon.", "MIN_ORDER_AMOUNT_NOT_MET");

                    couponDiscount = appliedCoupon.Type == CouponType.FixedAmount
                        ? Math.Min(appliedCoupon.Value, subTotal)
                        : Math.Round(subTotal * appliedCoupon.Value / 100, 2);
                }
            }

            // Points discount
            decimal pointDiscount = 0;
            if (request.PointsToRedeem > 0)
            {
                if (user.PointBalance < request.PointsToRedeem)
                    throw new BusinessException("Insufficient points.", "INSUFFICIENT_POINTS");

                var rule = await _db.PointRules.FirstOrDefaultAsync();
                var redeemRate = rule?.RedeemRate ?? 1m;
                pointDiscount = Math.Round(request.PointsToRedeem * redeemRate, 2);

                // Deduct points
                user.PointBalance -= request.PointsToRedeem;

                _db.Points.Add(new Point
                {
                    UserId = userId,
                    Type = PointType.Redeem,
                    Amount = -request.PointsToRedeem,
                    Note = "Order points redemption"
                });
            }

            // Shipping fee
            var shippingMethod = await _db.ShippingMethods.FirstOrDefaultAsync(s =>
                s.Id == request.ShippingMethodId && s.IsActive);

            decimal shippingFee = 0;
            ShippingMethodType shippingMethodType = ShippingMethodType.HomeDelivery;

            if (shippingMethod != null)
            {
                shippingMethodType = shippingMethod.Type;
                shippingFee = shippingMethod.BaseFee;
                if (shippingMethod.FreeShippingThreshold.HasValue && subTotal >= shippingMethod.FreeShippingThreshold.Value)
                    shippingFee = 0;
            }

            var totalAmount = Math.Max(0, subTotal - couponDiscount - pointDiscount + shippingFee);

            // Generate order number
            var orderNo = $"ORD{DateTime.UtcNow:yyyyMMdd}{_random.Next(1000, 9999)}";

            var order = new Order
            {
                OrderNo = orderNo,
                UserId = userId,
                Status = OrderStatus.Pending,
                PaymentMethod = PaymentMethod.ManualConfirmation,
                PaymentStatus = PaymentStatus.Unpaid,
                ShippingMethod = shippingMethodType,
                ShippingFee = shippingFee,
                SubTotal = subTotal,
                DiscountAmount = couponDiscount,
                PointDiscount = pointDiscount,
                TotalAmount = totalAmount,
                RecipientName = recipientName,
                RecipientPhone = recipientPhone,
                ShippingAddress = shippingAddress,
                StoreId = storeId,
                Note = request.Note
            };

            foreach (var item in orderItems)
            {
                item.OrderId = order.Id;
                order.Items.Add(item);
            }

            _db.Orders.Add(order);

            // Digital downloads
            foreach (var item in orderItems)
            {
                var product = await _db.Products.FindAsync(item.ProductId);
                if (product != null && product.Type == ProductType.Digital)
                {
                    _db.DigitalDownloads.Add(new DigitalDownload
                    {
                        OrderItemId = item.Id,
                        UserId = userId,
                        MaxDownloads = product.MaxDownloads ?? 5,
                        ExpiresAt = DateTime.UtcNow.AddHours(product.DownloadExpiryHours ?? 72)
                    });
                }
            }

            // OrderCoupon
            if (appliedCoupon != null && couponDiscount > 0)
            {
                _db.OrderCoupons.Add(new OrderCoupon
                {
                    OrderId = order.Id,
                    CouponId = appliedCoupon.Id,
                    DiscountAmount = couponDiscount
                });
                appliedCoupon.UsedCount++;
            }

            user.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            // Clear cart after successful order
            if (_cartService is CartService concreteCart)
                concreteCart.ClearCart(cartId);

            return MapOrderDetail(order);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<PagedResult<OrderSummaryDto>> GetOrdersAsync(Guid userId, OrderListRequest request)
    {
        var query = _db.Orders
            .Where(o => o.UserId == userId)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(o => (byte)o.Status == request.Status.Value);

        var projected = query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderSummaryDto
            {
                OrderNo = o.OrderNo,
                Status = (byte)o.Status,
                PaymentStatus = (byte)o.PaymentStatus,
                TotalAmount = o.TotalAmount,
                CreatedAt = o.CreatedAt,
                ItemCount = o.Items.Count
            });

        return await projected.ToPagedResultAsync(request.Page, request.PageSize);
    }

    public async Task<OrderDetailDto> GetOrderDetailAsync(Guid userId, string orderNo)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(o => o.OrderNo == orderNo && o.UserId == userId);

        if (order == null)
            throw new BusinessException("Order not found.", "ORDER_NOT_FOUND", 404);

        return MapOrderDetail(order);
    }

    public async Task CancelOrderAsync(Guid userId, string orderNo)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.OrderNo == orderNo && o.UserId == userId);

        if (order == null)
            throw new BusinessException("Order not found.", "ORDER_NOT_FOUND", 404);

        if (order.Status != OrderStatus.Pending)
            throw new BusinessException("Only pending orders can be cancelled.", "INVALID_ORDER_STATUS");

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        // Restore stock
        foreach (var item in order.Items)
        {
            if (item.Variant != null)
                item.Variant.Stock += item.Quantity;
            else
                item.Product.Stock += item.Quantity;
        }

        // Restore points if any were redeemed
        if (order.PointDiscount > 0)
        {
            var rule = await _db.PointRules.FirstOrDefaultAsync();
            var redeemRate = rule?.RedeemRate ?? 1m;
            var pointsToRestore = (int)Math.Ceiling(order.PointDiscount / redeemRate);

            var user = await _db.Users.FindAsync(userId);
            if (user != null)
            {
                user.PointBalance += pointsToRestore;
                user.UpdatedAt = DateTime.UtcNow;

                _db.Points.Add(new Point
                {
                    UserId = userId,
                    OrderId = order.Id,
                    Type = PointType.Adjust,
                    Amount = pointsToRestore,
                    Note = $"Points restored for cancelled order {orderNo}"
                });
            }
        }

        await _db.SaveChangesAsync();
    }

    public async Task ReturnOrderAsync(Guid userId, string orderNo)
    {
        var order = await _db.Orders
            .FirstOrDefaultAsync(o => o.OrderNo == orderNo && o.UserId == userId);

        if (order == null)
            throw new BusinessException("Order not found.", "ORDER_NOT_FOUND", 404);

        var allowedStatuses = new[]
        {
            OrderStatus.Paid,
            OrderStatus.Processing,
            OrderStatus.Shipped,
            OrderStatus.Completed
        };

        if (!allowedStatuses.Contains(order.Status))
            throw new BusinessException("Order cannot be returned in its current status.", "INVALID_ORDER_STATUS");

        order.PaymentStatus = PaymentStatus.Refunding;
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    public async Task<List<DownloadLinkDto>> GetDownloadsAsync(Guid userId, string orderNo)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNo == orderNo && o.UserId == userId);

        if (order == null)
            throw new BusinessException("Order not found.", "ORDER_NOT_FOUND", 404);

        var orderItemIds = order.Items.Select(i => i.Id).ToList();

        var downloads = await _db.DigitalDownloads
            .Include(d => d.OrderItem)
            .Where(d => orderItemIds.Contains(d.OrderItemId) && d.UserId == userId)
            .ToListAsync();

        return downloads.Select(d => new DownloadLinkDto
        {
            Token = d.Token,
            DownloadCount = d.DownloadCount,
            MaxDownloads = d.MaxDownloads,
            ExpiresAt = d.ExpiresAt,
            IsRevoked = d.IsRevoked,
            ProductName = d.OrderItem.ProductName
        }).ToList();
    }

    public async Task<(byte[] FileBytes, string ContentType, string FileName)> ExecuteDownloadAsync(string token)
    {
        var download = await _db.DigitalDownloads
            .Include(d => d.OrderItem)
            .FirstOrDefaultAsync(d => d.Token == token);

        if (download == null)
            throw new BusinessException("Invalid download token.", "INVALID_DOWNLOAD_TOKEN", 404);

        if (download.IsRevoked)
            throw new BusinessException("Download has been revoked.", "DOWNLOAD_REVOKED", 403);

        if (download.ExpiresAt < DateTime.UtcNow)
            throw new BusinessException("Download link has expired.", "DOWNLOAD_EXPIRED");

        if (download.DownloadCount >= download.MaxDownloads)
            throw new BusinessException("Maximum download count reached.", "DOWNLOAD_LIMIT_REACHED");

        download.DownloadCount++;
        await _db.SaveChangesAsync();

        // Return placeholder file bytes (real implementation would read actual file)
        var fileName = $"{download.OrderItem.ProductName}.zip";
        var fileBytes = System.Text.Encoding.UTF8.GetBytes($"Placeholder download for {download.OrderItem.ProductName}");
        return (fileBytes, "application/octet-stream", fileName);
    }

    private static OrderDetailDto MapOrderDetail(Order order)
    {
        return new OrderDetailDto
        {
            OrderNo = order.OrderNo,
            Status = (byte)order.Status,
            PaymentMethod = order.PaymentMethod.ToString(),
            PaymentStatus = (byte)order.PaymentStatus,
            ShippingMethod = order.ShippingMethod.ToString(),
            ShippingFee = order.ShippingFee,
            SubTotal = order.SubTotal,
            DiscountAmount = order.DiscountAmount,
            PointDiscount = order.PointDiscount,
            TotalAmount = order.TotalAmount,
            RecipientName = order.RecipientName,
            RecipientPhone = order.RecipientPhone,
            ShippingAddress = order.ShippingAddress,
            StoreId = order.StoreId,
            TrackingNo = order.TrackingNo,
            Note = order.Note,
            CreatedAt = order.CreatedAt,
            Items = order.Items.Select(i => new OrderItemDto
            {
                ProductId = i.ProductId,
                VariantId = i.VariantId,
                ProductName = i.ProductName,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                Subtotal = i.Subtotal,
                ImageUrl = i.Product?.Images?.OrderBy(img => img.SortOrder).FirstOrDefault()?.Url,
                IsDigital = i.Product?.Type == ProductType.Digital
            }).ToList()
        };
    }
}
