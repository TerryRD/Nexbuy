using Hangfire.Dashboard;

namespace Nexbuy.Jobs;

public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        // In development, allow all access to Hangfire dashboard
        return true;
    }
}
