using Microsoft.EntityFrameworkCore;
using Nexbuy.Data;
using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Members;
using Nexbuy.Helpers;
using Nexbuy.Middleware;
using Nexbuy.Models;
using Nexbuy.Models.Enums;
using Nexbuy.Services.Interfaces;

namespace Nexbuy.Services;

public class MemberService : IMemberService
{
    private readonly NexbuyDbContext _db;

    public MemberService(NexbuyDbContext db)
    {
        _db = db;
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            throw new BusinessException("User not found.", "USER_NOT_FOUND", 404);

        return MapUserProfile(user);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            throw new BusinessException("User not found.", "USER_NOT_FOUND", 404);

        if (request.Name != null)
            user.Name = request.Name;
        if (request.Phone != null)
            user.Phone = request.Phone;
        if (request.PreferredLocale != null)
            user.PreferredLocale = request.PreferredLocale;

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return MapUserProfile(user);
    }

    public async Task<List<AddressDto>> GetAddressesAsync(Guid userId)
    {
        var addresses = await _db.UserAddresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ToListAsync();

        return addresses.Select(MapAddress).ToList();
    }

    public async Task<AddressDto> CreateAddressAsync(Guid userId, CreateAddressRequest request)
    {
        if (request.IsDefault)
        {
            var existingDefaults = await _db.UserAddresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ToListAsync();
            foreach (var addr in existingDefaults)
                addr.IsDefault = false;
        }

        var address = new UserAddress
        {
            UserId = userId,
            Label = request.Label,
            RecipientName = request.RecipientName,
            Phone = request.Phone,
            AddressType = (AddressType)request.AddressType,
            ZipCode = request.ZipCode,
            City = request.City,
            Address = request.Address,
            StoreId = request.StoreId,
            StoreName = request.StoreName,
            IsDefault = request.IsDefault
        };

        _db.UserAddresses.Add(address);
        await _db.SaveChangesAsync();

        return MapAddress(address);
    }

    public async Task<AddressDto> UpdateAddressAsync(Guid userId, Guid addressId, UpdateAddressRequest request)
    {
        var address = await _db.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        if (address == null)
            throw new BusinessException("Address not found.", "ADDRESS_NOT_FOUND", 404);

        if (request.IsDefault)
        {
            var existingDefaults = await _db.UserAddresses
                .Where(a => a.UserId == userId && a.IsDefault && a.Id != addressId)
                .ToListAsync();
            foreach (var addr in existingDefaults)
                addr.IsDefault = false;
        }

        address.Label = request.Label;
        address.RecipientName = request.RecipientName;
        address.Phone = request.Phone;
        address.AddressType = (AddressType)request.AddressType;
        address.ZipCode = request.ZipCode;
        address.City = request.City;
        address.Address = request.Address;
        address.StoreId = request.StoreId;
        address.StoreName = request.StoreName;
        address.IsDefault = request.IsDefault;

        await _db.SaveChangesAsync();

        return MapAddress(address);
    }

    public async Task DeleteAddressAsync(Guid userId, Guid addressId)
    {
        var address = await _db.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        if (address == null)
            throw new BusinessException("Address not found.", "ADDRESS_NOT_FOUND", 404);

        _db.UserAddresses.Remove(address);
        await _db.SaveChangesAsync();
    }

    public async Task<PagedResult<PointHistoryDto>> GetPointsAsync(Guid userId, int page, int pageSize)
    {
        var query = _db.Points
            .Include(p => p.Order)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PointHistoryDto
            {
                Id = p.Id,
                Type = (byte)p.Type,
                Amount = p.Amount,
                ExpiresAt = p.ExpiresAt,
                Note = p.Note,
                CreatedAt = p.CreatedAt,
                OrderNo = p.Order != null ? p.Order.OrderNo : null
            });

        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<List<WishlistItemDto>> GetWishlistAsync(Guid userId)
    {
        var wishlists = await _db.Wishlists
            .Include(w => w.Product)
                .ThenInclude(p => p.Translations)
            .Include(w => w.Product)
                .ThenInclude(p => p.Images)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return wishlists.Select(w => new WishlistItemDto
        {
            ProductId = w.ProductId,
            Name = w.Product.Translations.FirstOrDefault()?.Name ?? w.Product.SKU,
            Price = w.Product.Price,
            ImageUrl = w.Product.Images.OrderBy(i => i.SortOrder).FirstOrDefault()?.Url,
            CreatedAt = w.CreatedAt
        }).ToList();
    }

    public async Task AddToWishlistAsync(Guid userId, Guid productId)
    {
        var product = await _db.Products.FindAsync(productId);
        if (product == null)
            throw new BusinessException("Product not found.", "PRODUCT_NOT_FOUND", 404);

        var exists = await _db.Wishlists.AnyAsync(w => w.UserId == userId && w.ProductId == productId);
        if (exists)
            throw new BusinessException("Product already in wishlist.", "ALREADY_IN_WISHLIST");

        _db.Wishlists.Add(new Wishlist
        {
            UserId = userId,
            ProductId = productId
        });

        await _db.SaveChangesAsync();
    }

    public async Task RemoveFromWishlistAsync(Guid userId, Guid productId)
    {
        var wishlist = await _db.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

        if (wishlist == null)
            throw new BusinessException("Wishlist item not found.", "WISHLIST_ITEM_NOT_FOUND", 404);

        _db.Wishlists.Remove(wishlist);
        await _db.SaveChangesAsync();
    }

    private static UserProfileDto MapUserProfile(User user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Phone = user.Phone,
            PreferredLocale = user.PreferredLocale,
            PointBalance = user.PointBalance,
            Status = (byte)user.Status,
            CreatedAt = user.CreatedAt
        };
    }

    private static AddressDto MapAddress(UserAddress address)
    {
        return new AddressDto
        {
            Id = address.Id,
            Label = address.Label,
            RecipientName = address.RecipientName,
            Phone = address.Phone,
            AddressType = (byte)address.AddressType,
            ZipCode = address.ZipCode,
            City = address.City,
            Address = address.Address,
            StoreId = address.StoreId,
            StoreName = address.StoreName,
            IsDefault = address.IsDefault
        };
    }
}
