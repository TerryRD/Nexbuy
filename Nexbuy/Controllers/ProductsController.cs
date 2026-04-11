using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Products;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers;

[ApiController]
[Route("api/v1/products")]
[AllowAnonymous]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet("")]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductListItemDto>>>> GetProducts(
        [FromQuery] ProductListRequest request)
    {
        var locale = Request.Headers["Accept-Language"].FirstOrDefault() ?? request.Lang ?? "zh-TW";
        request.Lang = locale;
        var result = await _productService.GetProductsAsync(request);
        return Ok(ApiResponse<PagedResult<ProductListItemDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> GetProductById(
        [FromRoute] Guid id,
        [FromQuery] string? lang)
    {
        var locale = Request.Headers["Accept-Language"].FirstOrDefault() ?? lang ?? "zh-TW";
        var result = await _productService.GetProductByIdAsync(id, locale);
        return Ok(ApiResponse<ProductDetailDto>.Ok(result));
    }

    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductListItemDto>>>> SearchProducts(
        [FromQuery] string q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var locale = Request.Headers["Accept-Language"].FirstOrDefault() ?? "zh-TW";
        var result = await _productService.SearchProductsAsync(q, page, pageSize, locale);
        return Ok(ApiResponse<PagedResult<ProductListItemDto>>.Ok(result));
    }
}
