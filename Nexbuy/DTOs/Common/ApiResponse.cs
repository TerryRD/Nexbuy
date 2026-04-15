namespace Nexbuy.DTOs.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public string? ErrorCode { get; set; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };
    public static ApiResponse<T> Fail(string message, string? errorCode = null) => new() { Success = false, Message = message, ErrorCode = errorCode };
}

public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse Ok() => new() { Success = true };
    public new static ApiResponse Fail(string message, string? errorCode = null) => new() { Success = false, Message = message, ErrorCode = errorCode };
}
