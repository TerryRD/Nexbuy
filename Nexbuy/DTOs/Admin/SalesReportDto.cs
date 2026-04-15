namespace Nexbuy.DTOs.Admin;

public class SalesReportDto
{
    public string Date { get; set; } = null!;
    public int OrderCount { get; set; }
    public decimal Revenue { get; set; }
}
