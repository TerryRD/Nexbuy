using Microsoft.AspNetCore.Http;
using Nexbuy.DTOs.Admin;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Products;

namespace Nexbuy.Services.Interfaces;

public interface IAdminProductService
{
    Task<PagedResult<ProductListItemDto>> GetProductsAsync(int page, int pageSize, string? search, byte? status);
    Task<ProductDetailDto> CreateProductAsync(AdminProductRequest request);
    Task<ProductDetailDto> UpdateProductAsync(Guid id, AdminProductRequest request);
    Task DeleteProductAsync(Guid id);
    Task<ImageDto> UploadImageAsync(Guid productId, IFormFile file);
    Task DeleteImageAsync(Guid productId, Guid imageId);
    Task<List<CategoryDto>> GetCategoriesAsync();
    Task<CategoryDto> CreateCategoryAsync(CategoryDto request);
    Task<CategoryDto> UpdateCategoryAsync(int id, CategoryDto request);
    Task DeleteCategoryAsync(int id);
}
