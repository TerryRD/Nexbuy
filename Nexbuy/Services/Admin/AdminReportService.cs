using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Admin;
using Nexbuy.Models.Enums;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services.Admin;

public class AdminReportService : IAdminReportService
{
    private readonly NexbuyDbContext _db;

    public AdminReportService(NexbuyDbContext db)
    {
        _db = db;
    }

    public async Task<List<SalesReportDto>> GetSalesReportAsync(DateTime startDate, DateTime endDate)
    {
        var orders = await _db.Orders
            .Where(o => o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new SalesReportDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                OrderCount = g.Count(),
                Revenue = g.Sum(o => o.TotalAmount)
            })
            .OrderBy(r => r.Date)
            .ToListAsync();

        return orders;
    }

    public async Task<List<TopProductDto>> GetTopProductsAsync(int count)
    {
        var topProducts = await _db.OrderItems
            .Include(oi => oi.Product)
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.Status != OrderStatus.Cancelled)
            .GroupBy(oi => new { oi.ProductId, oi.ProductName })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                TotalQuantity = g.Sum(oi => oi.Quantity),
                TotalRevenue = g.Sum(oi => oi.Subtotal)
            })
            .OrderByDescending(p => p.TotalQuantity)
            .Take(count)
            .ToListAsync();

        return topProducts;
    }

    public async Task<List<OrderTrendDto>> GetOrderTrendAsync(DateTime startDate, DateTime endDate)
    {
        var trend = await _db.Orders
            .Where(o => o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new OrderTrendDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Count = g.Count()
            })
            .OrderBy(t => t.Date)
            .ToListAsync();

        return trend;
    }

    public async Task<(byte[] FileBytes, string ContentType, string FileName)> ExportSalesReportAsync(DateTime startDate, DateTime endDate)
    {
        var report = await GetSalesReportAsync(startDate, endDate);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Sales Report");

        // Headers
        worksheet.Cell(1, 1).Value = "Date";
        worksheet.Cell(1, 2).Value = "Order Count";
        worksheet.Cell(1, 3).Value = "Revenue";

        var headerRow = worksheet.Row(1);
        headerRow.Style.Font.Bold = true;

        for (int i = 0; i < report.Count; i++)
        {
            var row = i + 2;
            worksheet.Cell(row, 1).Value = report[i].Date;
            worksheet.Cell(row, 2).Value = report[i].OrderCount;
            worksheet.Cell(row, 3).Value = report[i].Revenue;
        }

        // Summary row
        var summaryRow = report.Count + 2;
        worksheet.Cell(summaryRow, 1).Value = "Total";
        worksheet.Cell(summaryRow, 1).Style.Font.Bold = true;
        worksheet.Cell(summaryRow, 2).Value = report.Sum(r => r.OrderCount);
        worksheet.Cell(summaryRow, 3).Value = report.Sum(r => r.Revenue);

        worksheet.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        var fileName = $"SalesReport_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}.xlsx";
        return (ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
