using Nexbuy.DTOs.Common;
using Nexbuy.DTOs.Members;

namespace Nexbuy.Services.Interfaces;

public interface IMemberService
{
    Task<UserProfileDto> GetProfileAsync(Guid userId);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<List<AddressDto>> GetAddressesAsync(Guid userId);
    Task<AddressDto> CreateAddressAsync(Guid userId, CreateAddressRequest request);
    Task<AddressDto> UpdateAddressAsync(Guid userId, Guid addressId, UpdateAddressRequest request);
    Task DeleteAddressAsync(Guid userId, Guid addressId);
    Task<PagedResult<PointHistoryDto>> GetPointsAsync(Guid userId, int page, int pageSize);
    Task<List<WishlistItemDto>> GetWishlistAsync(Guid userId);
    Task AddToWishlistAsync(Guid userId, Guid productId);
    Task RemoveFromWishlistAsync(Guid userId, Guid productId);
}
