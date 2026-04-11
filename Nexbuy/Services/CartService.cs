using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Cart;
using Nexbuy.Middleware;
using Nexbuy.Models;
using Nexbuy.Models.Enums;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services;

public class CartService : ICartService
{
    private static readonly ConcurrentDictionary<string, CartState> _carts = new();
    private readonly IServiceScopeFactory _scopeFactory;

    public CartService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public Task<CartDto> GetCartAsync(string cartId)
    {
        var state = _carts.GetOrAdd(cartId, _ => new CartState());
        return Task.FromResult(MapToDto(state));
    }

    public async Task<CartDto> AddItemAsync(string cartId, AddToCartRequest request)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NexbuyDbContext>();

        var product = await db.Products
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.Status == ProductStatus.Active);

        if (product == null)
            throw new BusinessException("Product not found.", "PRODUCT_NOT_FOUND", 404);

        int availableStock;
        decimal unitPrice;
        string? variantName = null;

        if (request.VariantId.HasValue)
        {
            var variant = product.Variants.FirstOrDefault(v => v.Id == request.VariantId.Value);
            if (variant == null)
                throw new BusinessException("Product variant not found.", "VARIANT_NOT_FOUND", 404);
            availableStock = variant.Stock;
            unitPrice = product.Price + variant.PriceAdjustment;
            variantName = variant.VariantName;
        }
        else
        {
            availableStock = product.Stock;
            unitPrice = product.Price;
        }

        if (request.Quantity > availableStock)
            throw new BusinessException("Insufficient stock.", "INSUFFICIENT_STOCK");

        var state = _carts.GetOrAdd(cartId, _ => new CartState());
        var itemKey = $"{request.ProductId}_{request.VariantId}";

        lock (state.Lock)
        {
            var existing = state.Items.FirstOrDefault(i => i.ItemKey == itemKey);
            if (existing != null)
            {
                existing.Quantity += request.Quantity;
                if (existing.Quantity > availableStock)
                    throw new BusinessException("Insufficient stock.", "INSUFFICIENT_STOCK");
                existing.UnitPrice = unitPrice;
            }
            else
            {
                var productName = product.Translations.FirstOrDefault()?.Name ?? product.SKU;
                if (variantName != null)
                    productName = $"{productName} - {variantName}";

                state.Items.Add(new CartItemState
                {
                    Id = Guid.NewGuid().ToString("N"),
                    ItemKey = itemKey,
                    ProductId = request.ProductId,
                    VariantId = request.VariantId,
                    ProductName = productName,
                    ImageUrl = product.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.Url,
                    UnitPrice = unitPrice,
                    Quantity = request.Quantity,
                    Stock = availableStock,
                    Type = (byte)product.Type
                });
            }

            RecalculateTotals(state);
        }

        return MapToDto(state);
    }

    public Task<CartDto> UpdateItemAsync(string cartId, string itemId, UpdateCartItemRequest request)
    {
        if (!_carts.TryGetValue(cartId, out var state))
            throw new BusinessException("Cart not found.", "CART_NOT_FOUND", 404);

        lock (state.Lock)
        {
            var item = state.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null)
                throw new BusinessException("Cart item not found.", "CART_ITEM_NOT_FOUND", 404);

            if (request.Quantity > item.Stock)
                throw new BusinessException("Insufficient stock.", "INSUFFICIENT_STOCK");

            item.Quantity = request.Quantity;
            RecalculateTotals(state);
        }

        return Task.FromResult(MapToDto(state));
    }

    public Task<CartDto> RemoveItemAsync(string cartId, string itemId)
    {
        if (!_carts.TryGetValue(cartId, out var state))
            throw new BusinessException("Cart not found.", "CART_NOT_FOUND", 404);

        lock (state.Lock)
        {
            var item = state.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null)
                throw new BusinessException("Cart item not found.", "CART_ITEM_NOT_FOUND", 404);

            state.Items.Remove(item);
            RecalculateTotals(state);
        }

        return Task.FromResult(MapToDto(state));
    }

    public async Task<CartDto> MergeCartAsync(string userId, MergeCartRequest request)
    {
        var userCartId = userId;
        var state = _carts.GetOrAdd(userCartId, _ => new CartState());

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NexbuyDbContext>();

        foreach (var mergeItem in request.Items)
        {
            var product = await db.Products
                .Include(p => p.Translations)
                .Include(p => p.Images)
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Id == mergeItem.ProductId && p.Status == ProductStatus.Active);

            if (product == null) continue;

            int availableStock;
            decimal unitPrice;
            string? variantName = null;

            if (mergeItem.VariantId.HasValue)
            {
                var variant = product.Variants.FirstOrDefault(v => v.Id == mergeItem.VariantId.Value);
                if (variant == null) continue;
                availableStock = variant.Stock;
                unitPrice = product.Price + variant.PriceAdjustment;
                variantName = variant.VariantName;
            }
            else
            {
                availableStock = product.Stock;
                unitPrice = product.Price;
            }

            var itemKey = $"{mergeItem.ProductId}_{mergeItem.VariantId}";

            lock (state.Lock)
            {
                var existing = state.Items.FirstOrDefault(i => i.ItemKey == itemKey);
                if (existing != null)
                {
                    existing.Quantity = Math.Min(existing.Quantity + mergeItem.Quantity, availableStock);
                    existing.UnitPrice = unitPrice;
                }
                else
                {
                    var productName = product.Translations.FirstOrDefault()?.Name ?? product.SKU;
                    if (variantName != null)
                        productName = $"{productName} - {variantName}";

                    state.Items.Add(new CartItemState
                    {
                        Id = Guid.NewGuid().ToString("N"),
                        ItemKey = itemKey,
                        ProductId = mergeItem.ProductId,
                        VariantId = mergeItem.VariantId,
                        ProductName = productName,
                        ImageUrl = product.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.Url,
                        UnitPrice = unitPrice,
                        Quantity = Math.Min(mergeItem.Quantity, availableStock),
                        Stock = availableStock,
                        Type = (byte)product.Type
                    });
                }
            }
        }

        lock (state.Lock)
        {
            RecalculateTotals(state);
        }

        return MapToDto(state);
    }

    public async Task<CartDto> ApplyCouponAsync(string cartId, ApplyCouponRequest request)
    {
        var state = _carts.GetOrAdd(cartId, _ => new CartState());

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<NexbuyDbContext>();

        var coupon = await db.Coupons.FirstOrDefaultAsync(c =>
            c.Code == request.Code &&
            c.Status == CouponStatus.Active &&
            c.StartAt <= DateTime.UtcNow &&
            c.ExpiredAt > DateTime.UtcNow);

        if (coupon == null)
            throw new BusinessException("Invalid or expired coupon.", "INVALID_COUPON");

        if (coupon.UsageLimit.HasValue && coupon.UsedCount >= coupon.UsageLimit.Value)
            throw new BusinessException("Coupon usage limit reached.", "COUPON_LIMIT_REACHED");

        lock (state.Lock)
        {
            var subTotal = state.Items.Sum(i => i.UnitPrice * i.Quantity);

            if (subTotal < coupon.MinOrderAmount)
                throw new BusinessException(
                    $"Minimum order amount is {coupon.MinOrderAmount}.",
                    "MIN_ORDER_AMOUNT_NOT_MET");

            state.CouponCode = request.Code;

            if (coupon.Type == CouponType.FixedAmount)
            {
                state.DiscountAmount = Math.Min(coupon.Value, subTotal);
            }
            else // Percentage
            {
                state.DiscountAmount = Math.Round(subTotal * coupon.Value / 100, 2);
            }

            RecalculateTotals(state);
        }

        return MapToDto(state);
    }

    public Task<CartDto> RemoveCouponAsync(string cartId)
    {
        if (!_carts.TryGetValue(cartId, out var state))
            throw new BusinessException("Cart not found.", "CART_NOT_FOUND", 404);

        lock (state.Lock)
        {
            state.CouponCode = null;
            state.DiscountAmount = 0;
            RecalculateTotals(state);
        }

        return Task.FromResult(MapToDto(state));
    }

    /// <summary>
    /// Internal method used by OrderService to clear cart after order creation.
    /// Not part of the ICartService interface.
    /// </summary>
    internal void ClearCart(string cartId)
    {
        if (_carts.TryGetValue(cartId, out var state))
        {
            lock (state.Lock)
            {
                state.Items.Clear();
                state.CouponCode = null;
                state.DiscountAmount = 0;
            }
        }
    }

    private static void RecalculateTotals(CartState state)
    {
        // Must be called within lock
        // Discount is already set by ApplyCouponAsync; if no coupon, reset
        if (state.CouponCode == null)
            state.DiscountAmount = 0;
    }

    private static CartDto MapToDto(CartState state)
    {
        lock (state.Lock)
        {
            var subTotal = state.Items.Sum(i => i.UnitPrice * i.Quantity);
            return new CartDto
            {
                Items = state.Items.Select(i => new CartItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    VariantId = i.VariantId,
                    ProductName = i.ProductName,
                    ImageUrl = i.ImageUrl,
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity,
                    Subtotal = i.UnitPrice * i.Quantity,
                    Stock = i.Stock,
                    Type = i.Type
                }).ToList(),
                SubTotal = subTotal,
                DiscountAmount = state.DiscountAmount,
                Total = Math.Max(0, subTotal - state.DiscountAmount),
                CouponCode = state.CouponCode
            };
        }
    }
}

internal class CartState
{
    public object Lock { get; } = new();
    public List<CartItemState> Items { get; set; } = new();
    public string? CouponCode { get; set; }
    public decimal DiscountAmount { get; set; }
}

internal class CartItemState
{
    public string Id { get; set; } = null!;
    public string ItemKey { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? ImageUrl { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public int Stock { get; set; }
    public byte Type { get; set; }
}
