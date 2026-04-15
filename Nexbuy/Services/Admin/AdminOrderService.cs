using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Orders;
using Nexbuy.Helpers;
using Nexbuy.Middleware;
using Nexbuy.Models.Enums;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services.Admin;

public class AdminOrderService : IAdminOrderService
{
    private readonly NexbuyDbContext _db;

    public AdminOrderService(NexbuyDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<OrderSummaryDto>> GetOrdersAsync(int page, int pageSize, byte? status, string? search)
    {
        var query = _db.Orders.AsQueryable();

        if (status.HasValue)
            query = query.Where(o => (byte)o.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(o =>
                o.OrderNo.Contains(keyword) ||
                o.RecipientName.Contains(keyword) ||
                o.User.Email.Contains(keyword));
        }

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

        return await projected.ToPagedResultAsync(page, pageSize);
    }

    public async Task<OrderDetailDto> GetOrderDetailAsync(string orderNo)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(o => o.OrderNo == orderNo);

        if (order == null)
            throw new BusinessException("Order not found.", "ORDER_NOT_FOUND", 404);

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

    public async Task UpdateStatusAsync(string orderNo, AdminOrderStatusRequest request)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.OrderNo == orderNo);
        if (order == null)
            throw new BusinessException("Order not found.", "ORDER_NOT_FOUND", 404);

        var newStatus = (OrderStatus)request.Status;
        var currentStatus = order.Status;

        // Validate state transitions
        var validTransitions = new Dictionary<OrderStatus, OrderStatus[]>
        {
            [OrderStatus.Pending] = new[] { OrderStatus.Paid, OrderStatus.Cancelled },
            [OrderStatus.Paid] = new[] { OrderStatus.Processing, OrderStatus.Cancelled },
            [OrderStatus.Processing] = new[] { OrderStatus.Shipped },
            [OrderStatus.Shipped] = new[] { OrderStatus.Completed },
            [OrderStatus.Completed] = Array.Empty<OrderStatus>(),
            [OrderStatus.Cancelled] = Array.Empty<OrderStatus>()
        };

        if (!validTransitions.ContainsKey(currentStatus) ||
            !validTransitions[currentStatus].Contains(newStatus))
        {
            throw new BusinessException(
                $"Cannot transition from {currentStatus} to {newStatus}.",
                "INVALID_STATUS_TRANSITION");
        }

        order.Status = newStatus;

        // Update payment status when transitioning to Paid
        if (newStatus == OrderStatus.Paid)
            order.PaymentStatus = PaymentStatus.Paid;

        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task UpdateTrackingAsync(string orderNo, AdminTrackingRequest request)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.OrderNo == orderNo);
        if (order == null)
            throw new BusinessException("Order not found.", "ORDER_NOT_FOUND", 404);

        order.TrackingNo = request.TrackingNo;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<(byte[] FileBytes, string ContentType, string FileName)> ExportOrdersAsync(DateTime? startDate, DateTime? endDate)
    {
        var query = _db.Orders
            .Include(o => o.User)
            .Include(o => o.Items)
            .AsQueryable();

        if (startDate.HasValue)
            query = query.Where(o => o.CreatedAt >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(o => o.CreatedAt <= endDate.Value);

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Orders");

        // Headers
        worksheet.Cell(1, 1).Value = "Order No";
        worksheet.Cell(1, 2).Value = "Status";
        worksheet.Cell(1, 3).Value = "Payment Status";
        worksheet.Cell(1, 4).Value = "Customer Email";
        worksheet.Cell(1, 5).Value = "Recipient";
        worksheet.Cell(1, 6).Value = "SubTotal";
        worksheet.Cell(1, 7).Value = "Discount";
        worksheet.Cell(1, 8).Value = "Shipping Fee";
        worksheet.Cell(1, 9).Value = "Total";
        worksheet.Cell(1, 10).Value = "Items";
        worksheet.Cell(1, 11).Value = "Created At";

        var headerRow = worksheet.Row(1);
        headerRow.Style.Font.Bold = true;

        for (int i = 0; i < orders.Count; i++)
        {
            var o = orders[i];
            var row = i + 2;
            worksheet.Cell(row, 1).Value = o.OrderNo;
            worksheet.Cell(row, 2).Value = o.Status.ToString();
            worksheet.Cell(row, 3).Value = o.PaymentStatus.ToString();
            worksheet.Cell(row, 4).Value = o.User?.Email ?? "";
            worksheet.Cell(row, 5).Value = o.RecipientName;
            worksheet.Cell(row, 6).Value = o.SubTotal;
            worksheet.Cell(row, 7).Value = o.DiscountAmount;
            worksheet.Cell(row, 8).Value = o.ShippingFee;
            worksheet.Cell(row, 9).Value = o.TotalAmount;
            worksheet.Cell(row, 10).Value = o.Items.Count;
            worksheet.Cell(row, 11).Value = o.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss");
        }

        worksheet.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        var fileName = $"Orders_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
        return (ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
