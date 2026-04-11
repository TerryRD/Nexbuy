using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Orders;

namespace Nexbuy.Services.Interfaces;

public interface IAdminOrderService
{
    Task<PagedResult<OrderSummaryDto>> GetOrdersAsync(int page, int pageSize, byte? status, string? search);
    Task<OrderDetailDto> GetOrderDetailAsync(string orderNo);
    Task UpdateStatusAsync(string orderNo, AdminOrderStatusRequest request);
    Task UpdateTrackingAsync(string orderNo, AdminTrackingRequest request);
    Task<(byte[] FileBytes, string ContentType, string FileName)> ExportOrdersAsync(DateTime? startDate, DateTime? endDate);
}
