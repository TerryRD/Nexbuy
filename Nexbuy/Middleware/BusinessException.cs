namespace Nexbuy.Middleware;

public class BusinessException : Exception
{
    public int StatusCode { get; }
    public string? ErrorCode { get; }

    public BusinessException(string message, string? errorCode = null, int statusCode = 400) : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }
}
