using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Products;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers;

[ApiController]
[Route("api/v1/categories")]
[AllowAnonymous]
public class CategoriesController : ControllerBase
{
    private readonly IProductService _productService;

    public CategoriesController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet("")]
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetCategories()
    {
        var locale = Request.Headers["Accept-Language"].FirstOrDefault() ?? "zh-TW";
        var result = await _productService.GetCategoriesAsync(locale);
        return Ok(ApiResponse<List<CategoryDto>>.Ok(result));
    }

    [HttpGet("{id:int}/products")]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductListItemDto>>>> GetCategoryProducts(
        [FromRoute] int id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var locale = Request.Headers["Accept-Language"].FirstOrDefault() ?? "zh-TW";
        var result = await _productService.GetCategoryProductsAsync(id, page, pageSize, locale);
        return Ok(ApiResponse<PagedResult<ProductListItemDto>>.Ok(result));
    }
}
