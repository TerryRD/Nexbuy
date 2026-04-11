import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartApi, type Cart, type CartItem } from '@/api/cart'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const couponCode = ref<string | null>(null)
  const discountAmount = ref(0)
  const loading = ref(false)

  const itemCount = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  const subTotal = computed(() => items.value.reduce((sum, i) => sum + i.subtotal, 0))
  const total = computed(() => Math.max(0, subTotal.value - discountAmount.value))

  function loadGuestCart() {
    const stored = localStorage.getItem('guestCart')
    if (stored) {
      try { items.value = JSON.parse(stored) } catch { items.value = [] }
    }
  }

  function saveGuestCart() {
    localStorage.setItem('guestCart', JSON.stringify(items.value))
  }

  async function fetchCart() {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      loadGuestCart()
      return
    }
    loading.value = true
    try {
      const res = await cartApi.getCart()
      const cart = res.data as Cart
      items.value = cart.items
      couponCode.value = cart.couponCode || null
      discountAmount.value = cart.discountAmount
    } catch {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  async function addItem(productId: string, quantity: number, variantId?: string, productInfo?: Partial<CartItem>) {
    const auth = useAuthStore()
    if (auth.isAuthenticated) {
      await cartApi.addItem({ productId, variantId, quantity })
      await fetchCart()
    } else {
      const key = `${productId}-${variantId || ''}`
      const existing = items.value.find(i => i.id === key)
      if (existing) {
        existing.quantity += quantity
        existing.subtotal = existing.unitPrice * existing.quantity
      } else {
        items.value.push({
          id: key,
          productId,
          variantId: variantId || undefined,
          productName: productInfo?.productName || '',
          imageUrl: productInfo?.imageUrl || '',
          unitPrice: productInfo?.unitPrice || 0,
          quantity,
          subtotal: (productInfo?.unitPrice || 0) * quantity,
          stock: productInfo?.stock || 999,
          type: productInfo?.type || 0
        })
      }
      saveGuestCart()
    }
  }

  async function updateItem(id: string, quantity: number) {
    const auth = useAuthStore()
    if (auth.isAuthenticated) {
      await cartApi.updateItem(id, quantity)
      await fetchCart()
    } else {
      const item = items.value.find(i => i.id === id)
      if (item) {
        item.quantity = quantity
        item.subtotal = item.unitPrice * quantity
      }
      saveGuestCart()
    }
  }

  async function removeItem(id: string) {
    const auth = useAuthStore()
    if (auth.isAuthenticated) {
      await cartApi.removeItem(id)
      await fetchCart()
    } else {
      items.value = items.value.filter(i => i.id !== id)
      saveGuestCart()
    }
  }

  async function applyCoupon(code: string) {
    await cartApi.applyCoupon(code)
    await fetchCart()
  }

  async function removeCoupon() {
    await cartApi.removeCoupon()
    await fetchCart()
  }

  function clearCart() {
    items.value = []
    couponCode.value = null
    discountAmount.value = 0
    localStorage.removeItem('guestCart')
  }

  return {
    items, couponCode, discountAmount, loading,
    itemCount, subTotal, total,
    fetchCart, addItem, updateItem, removeItem,
    applyCoupon, removeCoupon, clearCart
  }
})
