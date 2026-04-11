using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Products;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/categories")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminCategoriesController : ControllerBase
{
    private readonly IAdminProductService _adminProductService;

    public AdminCategoriesController(IAdminProductService adminProductService)
    {
        _adminProductService = adminProductService;
    }

    [HttpGet("")]
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetCategories()
    {
        var result = await _adminProductService.GetCategoriesAsync();
        return Ok(ApiResponse<List<CategoryDto>>.Ok(result));
    }

    [HttpPost("")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> CreateCategory([FromBody] CategoryDto request)
    {
        var result = await _adminProductService.CreateCategoryAsync(request);
        return Ok(ApiResponse<CategoryDto>.Ok(result));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> UpdateCategory(
        [FromRoute] int id,
        [FromBody] CategoryDto request)
    {
        var result = await _adminProductService.UpdateCategoryAsync(id, request);
        return Ok(ApiResponse<CategoryDto>.Ok(result));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse>> DeleteCategory([FromRoute] int id)
    {
        await _adminProductService.DeleteCategoryAsync(id);
        return Ok(ApiResponse.Ok());
    }
}
