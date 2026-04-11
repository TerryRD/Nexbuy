namespace Nexbuy.DTOs.Admin;

public class AdminPointRuleRequest
{
    public decimal EarnRate { get; set; }
    public decimal RedeemRate { get; set; }
    public int PointExpiryMonths { get; set; }
}
