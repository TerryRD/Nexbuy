using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Products;
using Nexbuy.Helpers;
using Nexbuy.Middleware;
using Nexbuy.Models;
using Nexbuy.Models.Enums;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services;

public class ProductService : IProductService
{
    private readonly NexbuyDbContext _db;

    public ProductService(NexbuyDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductListRequest request)
    {
        var query = _db.Products
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Include(p => p.Category)
            .Where(p => p.Status == ProductStatus.Active)
            .AsQueryable();

        if (request.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var keyword = request.Search.Trim();
            query = query.Where(p => p.Translations.Any(t =>
                t.Locale == request.Lang &&
                (t.Name.Contains(keyword) || (t.Description != null && t.Description.Contains(keyword)))));
        }

        query = request.Sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "newest" => query.OrderByDescending(p => p.CreatedAt),
            "popular" => query.OrderByDescending(p => p.Wishlists.Count),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var projected = query.Select(p => new ProductListItemDto
        {
            Id = p.Id,
            Name = p.Translations
                .Where(t => t.Locale == request.Lang)
                .Select(t => t.Name)
                .FirstOrDefault()
                ?? p.Translations.Select(t => t.Name).FirstOrDefault()
                ?? p.SKU,
            Price = p.Price,
            ImageUrl = p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
            Type = (byte)p.Type,
            Stock = p.Stock,
            CategorySlug = p.Category.Slug
        });

        return await projected.ToPagedResultAsync(request.Page, request.PageSize);
    }

    public async Task<ProductDetailDto> GetProductByIdAsync(Guid id, string locale)
    {
        var product = await _db.Products
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            throw new BusinessException("Product not found.", "PRODUCT_NOT_FOUND", 404);

        return new ProductDetailDto
        {
            Id = product.Id,
            SKU = product.SKU,
            Type = (byte)product.Type,
            Price = product.Price,
            Stock = product.Stock,
            MaxDownloads = product.MaxDownloads,
            DownloadExpiryHours = product.DownloadExpiryHours,
            Status = (byte)product.Status,
            CategoryId = product.CategoryId,
            Translations = product.Translations.Select(t => new TranslationDto
            {
                Locale = t.Locale,
                Name = t.Name,
                Description = t.Description
            }).ToList(),
            Images = product.Images.OrderBy(i => i.SortOrder).Select(i => new ImageDto
            {
                Id = i.Id,
                Url = i.Url,
                SortOrder = i.SortOrder
            }).ToList(),
            Variants = product.Variants.Select(v => new VariantDto
            {
                Id = v.Id,
                VariantName = v.VariantName,
                PriceAdjustment = v.PriceAdjustment,
                Stock = v.Stock,
                SKU = v.SKU
            }).ToList()
        };
    }

    public async Task<PagedResult<ProductListItemDto>> SearchProductsAsync(string keyword, int page, int pageSize, string locale)
    {
        var trimmed = keyword.Trim();

        var searchQuery = _db.Products
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Include(p => p.Category)
            .Where(p => p.Status == ProductStatus.Active)
            .Where(p => p.Translations.Any(t =>
                t.Locale == locale &&
                (t.Name.Contains(trimmed) || (t.Description != null && t.Description.Contains(trimmed)))))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProductListItemDto
            {
                Id = p.Id,
                Name = p.Translations
                    .Where(t => t.Locale == locale)
                    .Select(t => t.Name)
                    .FirstOrDefault()
                    ?? p.Translations.Select(t => t.Name).FirstOrDefault()
                    ?? p.SKU,
                Price = p.Price,
                ImageUrl = p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                Type = (byte)p.Type,
                Stock = p.Stock,
                CategorySlug = p.Category.Slug
            });

        return await searchQuery.ToPagedResultAsync(page, pageSize);
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync(string locale)
    {
        var categories = await _db.Categories
            .Include(c => c.Children)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        var roots = categories.Where(c => c.ParentId == null).ToList();
        return roots.Select(c => MapCategory(c)).ToList();
    }

    private static CategoryDto MapCategory(Category category)
    {
        return new CategoryDto
        {
            Id = category.Id,
            Slug = category.Slug,
            SortOrder = category.SortOrder,
            Name = category.Slug, // Categories don't have translations; use slug as display name
            Children = category.Children
                .OrderBy(c => c.SortOrder)
                .Select(c => MapCategory(c))
                .ToList()
        };
    }

    public async Task<PagedResult<ProductListItemDto>> GetCategoryProductsAsync(int categoryId, int page, int pageSize, string locale)
    {
        // Include subcategory IDs
        var categoryIds = await GetCategoryTreeIdsAsync(categoryId);

        var query = _db.Products
            .Include(p => p.Translations)
            .Include(p => p.Images)
            .Include(p => p.Category)
            .Where(p => p.Status == ProductStatus.Active && categoryIds.Contains(p.CategoryId))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProductListItemDto
            {
                Id = p.Id,
                Name = p.Translations
                    .Where(t => t.Locale == locale)
                    .Select(t => t.Name)
                    .FirstOrDefault()
                    ?? p.Translations.Select(t => t.Name).FirstOrDefault()
                    ?? p.SKU,
                Price = p.Price,
                ImageUrl = p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                Type = (byte)p.Type,
                Stock = p.Stock,
                CategorySlug = p.Category.Slug
            });

        return await query.ToPagedResultAsync(page, pageSize);
    }

    private async Task<List<int>> GetCategoryTreeIdsAsync(int categoryId)
    {
        var allCategories = await _db.Categories.ToListAsync();
        var ids = new List<int>();
        CollectChildIds(allCategories, categoryId, ids);
        return ids;
    }

    private static void CollectChildIds(List<Category> all, int parentId, List<int> ids)
    {
        ids.Add(parentId);
        var children = all.Where(c => c.ParentId == parentId);
        foreach (var child in children)
        {
            CollectChildIds(all, child.Id, ids);
        }
    }
}
