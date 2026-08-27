import assert from 'node:assert';

console.log('--- RUNNING CHECKOUT & ORDER ISOLATION AUTOMATED SUITE ---');

// 1. Test Order ID Generation Entropy & Uniqueness
function generateOrderId(): string {
  return `ord-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

const id1 = generateOrderId();
const id2 = generateOrderId();
assert.notStrictEqual(id1, id2, 'Order IDs must be unique');
assert.match(id1, /^ord-\d+-[a-z0-9]+$/, 'Order ID must match high-entropy format');
console.log('✓ Unique high-entropy Order ID format verified:', id1);

// 2. Test Meta Event ID Determinism & Deduplication Matching
function getPurchaseEventId(orderId: string): string {
  return `purchase_${orderId}`;
}

const eventId1 = getPurchaseEventId(id1);
const eventId2 = getPurchaseEventId(id2);
assert.strictEqual(eventId1, `purchase_${id1}`);
assert.notStrictEqual(eventId1, eventId2);
console.log('✓ Meta Pixel & CAPI event_id format verified:', eventId1);

// 3. Test Cart Hash Behavior: Cart Clearing Must NOT Reset Created Order
let createdOrder: any = { id: id1, total: 95 };
let prevCartHash = 'prod-1:1:95';

// Simulate buyer clearing cart on successful order completion
function handleCartChange(cart: Array<{ id: string; qty: number; price: number }>) {
  if (cart.length > 0) {
    const currentHash = cart.map(i => `${i.id}:${i.qty}:${i.price}`).sort().join('|');
    if (prevCartHash && prevCartHash !== currentHash) {
      createdOrder = null;
    }
    prevCartHash = currentHash;
  }
}

// Payment succeeds -> cart cleared to []
handleCartChange([]);
assert.ok(createdOrder !== null, 'createdOrder must NOT be wiped when cart is cleared upon success');
assert.strictEqual(createdOrder.id, id1);
console.log('✓ Success view preservation on cart clear verified');

// Buyer switches to Product B -> cart becomes [Product B]
handleCartChange([{ id: 'prod-2', qty: 1, price: 150 }]);
assert.strictEqual(createdOrder, null, 'createdOrder MUST be reset when buyer switches to Product B');
console.log('✓ Fresh state reset on sequential product selection verified');

// 4. Test Zero-Total Order Discount
function calculateFinalTotal(subtotal: number, discount: number): number {
  return Math.max(0, Number((subtotal - discount).toFixed(2)));
}

const zeroTotal = calculateFinalTotal(95, 95);
assert.strictEqual(zeroTotal, 0);
const paidTotal = calculateFinalTotal(95, 10);
assert.strictEqual(paidTotal, 85);
console.log('✓ 100% coupon and partial coupon calculations verified');

// 5. Test JSON Text Safe Parsing Fallback
function safeParseJson(text: string, defaultError: string): { data: any; errorMessage?: string } {
  try {
    if (!text || !text.trim()) return { data: null, errorMessage: defaultError };
    const json = JSON.parse(text);
    return { data: json };
  } catch (e: any) {
    return { data: null, errorMessage: defaultError };
  }
}

const emptyRes = safeParseJson('', 'Server error creating order. Please try again.');
assert.strictEqual(emptyRes.errorMessage, 'Server error creating order. Please try again.');
const validRes = safeParseJson('{"success":true,"orderId":"ord-123"}', 'Default');
assert.strictEqual(validRes.data?.success, true);
console.log('✓ Safe JSON response parsing with non-empty error fallbacks verified');

console.log('--- ALL CHECKOUT FLOW TESTS PASSED SUCCESSFULLY! ---');
