using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Products;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/products")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminProductsController : ControllerBase
{
    private readonly IAdminProductService _adminProductService;

    public AdminProductsController(IAdminProductService adminProductService)
    {
        _adminProductService = adminProductService;
    }

    [HttpGet("")]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductListItemDto>>>> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] byte? status = null)
    {
        var result = await _adminProductService.GetProductsAsync(page, pageSize, search, status);
        return Ok(ApiResponse<PagedResult<ProductListItemDto>>.Ok(result));
    }

    [HttpPost("")]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> CreateProduct(
        [FromBody] AdminProductRequest request)
    {
        var result = await _adminProductService.CreateProductAsync(request);
        return Ok(ApiResponse<ProductDetailDto>.Ok(result));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProductDetailDto>>> UpdateProduct(
        [FromRoute] Guid id,
        [FromBody] AdminProductRequest request)
    {
        var result = await _adminProductService.UpdateProductAsync(id, request);
        return Ok(ApiResponse<ProductDetailDto>.Ok(result));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteProduct([FromRoute] Guid id)
    {
        await _adminProductService.DeleteProductAsync(id);
        return Ok(ApiResponse.Ok());
    }

    [HttpPost("{id:guid}/images")]
    public async Task<ActionResult<ApiResponse<ImageDto>>> UploadImage(
        [FromRoute] Guid id,
        [FromForm] IFormFile file)
    {
        var result = await _adminProductService.UploadImageAsync(id, file);
        return Ok(ApiResponse<ImageDto>.Ok(result));
    }

    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteImage(
        [FromRoute] Guid id,
        [FromRoute] Guid imageId)
    {
        await _adminProductService.DeleteImageAsync(id, imageId);
        return Ok(ApiResponse.Ok());
    }
}
