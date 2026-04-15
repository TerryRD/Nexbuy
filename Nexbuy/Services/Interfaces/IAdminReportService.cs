using Nexbuy.DTOs.Admin;

namespace Nexbuy.Services.Interfaces;

public interface IAdminReportService
{
    Task<List<SalesReportDto>> GetSalesReportAsync(DateTime startDate, DateTime endDate);
    Task<List<TopProductDto>> GetTopProductsAsync(int count);
    Task<List<OrderTrendDto>> GetOrderTrendAsync(DateTime startDate, DateTime endDate);
    Task<(byte[] FileBytes, string ContentType, string FileName)> ExportSalesReportAsync(DateTime startDate, DateTime endDate);
}
