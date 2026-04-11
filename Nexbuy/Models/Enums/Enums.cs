namespace Nexbuy.Models.Enums;

public enum UserStatus : byte { Disabled = 0, Active = 1 }
public enum ProductType : byte { Physical = 0, Digital = 1 }
public enum ProductStatus : byte { Inactive = 0, Active = 1 }
public enum AddressType : byte { Regular = 0, ConvenienceStore = 1 }
public enum OrderStatus : byte { Pending = 0, Paid = 1, Processing = 2, Shipped = 3, Completed = 4, Cancelled = 5 }
public enum PaymentMethod : byte { ManualConfirmation = 0 }
public enum PaymentStatus : byte { Unpaid = 0, Paid = 1, Refunding = 2, Refunded = 3 }
public enum ShippingMethodType : byte { HomeDelivery = 0, SevenEleven = 1, FamilyMart = 2 }
public enum CouponType : byte { FixedAmount = 0, Percentage = 1 }
public enum PointType : byte { Earn = 0, Redeem = 1, Expire = 2, Adjust = 3 }
public enum AdminRole : byte { SuperAdmin = 0, Admin = 1 }
public enum CouponStatus : byte { Disabled = 0, Active = 1 }
