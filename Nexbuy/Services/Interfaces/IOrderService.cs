using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Orders;

namespace Nexbuy.Services.Interfaces;

public interface IOrderService
{
    Task<OrderDetailDto> CreateOrderAsync(Guid userId, CreateOrderRequest request);
    Task<PagedResult<OrderSummaryDto>> GetOrdersAsync(Guid userId, OrderListRequest request);
    Task<OrderDetailDto> GetOrderDetailAsync(Guid userId, string orderNo);
    Task CancelOrderAsync(Guid userId, string orderNo);
    Task ReturnOrderAsync(Guid userId, string orderNo);
    Task<List<DownloadLinkDto>> GetDownloadsAsync(Guid userId, string orderNo);
    Task<(byte[] FileBytes, string ContentType, string FileName)> ExecuteDownloadAsync(string token);
}
