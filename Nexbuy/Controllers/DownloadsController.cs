using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers;

[ApiController]
[Route("api/v1/downloads")]
public class DownloadsController : ControllerBase
{
    private readonly IOrderService _orderService;

    public DownloadsController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [AllowAnonymous]
    [HttpGet("{token}")]
    public async Task<IActionResult> ExecuteDownload([FromRoute] string token)
    {
        var (fileBytes, contentType, fileName) = await _orderService.ExecuteDownloadAsync(token);
        return File(fileBytes, contentType, fileName);
    }
}
