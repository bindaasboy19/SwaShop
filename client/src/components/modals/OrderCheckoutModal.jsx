import React, { useState } from 'react';
import { X, CheckCircle, Package, Truck, Store, CreditCard, ShieldCheck } from 'lucide-react';
import { apiPost } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const OrderCheckoutModal = ({ isOpen, onClose, product, seller }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [fulfilmentType, setFulfilmentType] = useState('PICKUP');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: seller?.city || 'Jaipur',
    state: seller?.state || 'Rajasthan',
    pincode: seller?.pincode || ''
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  if (!isOpen || !product) return null;

  const unitPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
  const subtotal = unitPrice * quantity;

  let deliveryFee = 0;
  if (fulfilmentType === 'SELLER_DELIVERY') {
    deliveryFee = subtotal >= 1000 ? 0 : 50;
  } else if (fulfilmentType === 'THIRD_PARTY_DELIVERY') {
    deliveryFee = subtotal >= 1500 ? 0 : 90;
  }
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!shippingAddress.phone && fulfilmentType !== 'PICKUP') {
      showToast('Please enter your contact phone number', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const idempotencyKey = `ORD-${user?._id || 'guest'}-${Date.now()}`;
      const payload = {
        sellerId: seller?._id || product.sellerId?._id || product.sellerId,
        items: [
          {
            productId: product._id,
            quantity
          }
        ],
        fulfilmentType,
        paymentMethod,
        shippingAddress,
        notes,
        idempotencyKey
      };

      const res = await apiPost('/orders', payload);
      if (res && res.success) {
        setConfirmedOrder(res.order);
        showToast('Order confirmed successfully!', 'success');
      } else {
        showToast(res?.message || 'Failed to place order', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error creating order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-800 text-lg">
              {confirmedOrder ? 'Order Confirmed' : 'Direct Order / Checkout'}
            </h3>
          </div>
          <button
            onClick={() => {
              setConfirmedOrder(null);
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          /* Confirmation Screen */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">Thank You for Supporting Local!</h4>
              <p className="text-sm text-slate-500 mt-1">Your order has been placed with {seller?.businessName}.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-bold text-slate-800">{confirmedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-brand-600 text-sm">₹{confirmedOrder.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fulfilment Type:</span>
                <span className="font-semibold text-slate-700 capitalize">{confirmedOrder.fulfilmentType?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{confirmedOrder.orderStatus}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  navigate('/orders');
                }}
                className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition"
              >
                Track Your Order
              </button>
              <button
                onClick={() => {
                  setConfirmedOrder(null);
                  onClose();
                }}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Order Form */
          <form onSubmit={handlePlaceOrder} className="p-6 space-y-4 overflow-y-auto">
            {/* Item summary */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200'}
                alt={product.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-800 truncate">{product.name}</h4>
                <p className="text-[11px] text-slate-500">{seller?.businessName}</p>
                <span className="text-xs font-extrabold text-brand-600">₹{unitPrice}</span>
              </div>
              {/* Quantity stepper */}
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-slate-400 hover:text-slate-700 font-bold text-sm"
                >
                  -
                </button>
                <span className="text-xs font-bold w-4 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fulfilment Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-brand-600" /> Fulfilment Method
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFulfilmentType('PICKUP')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                    fulfilmentType === 'PICKUP' ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Store className="w-4 h-4 mb-1 text-slate-600" />
                  <span>Store Pickup</span>
                  <span className="text-[10px] text-emerald-600 font-bold">FREE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFulfilmentType('SELLER_DELIVERY')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                    fulfilmentType === 'SELLER_DELIVERY' ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-4 h-4 mb-1 text-slate-600" />
                  <span>Local Delivery</span>
                  <span className="text-[10px] text-slate-500">{subtotal >= 1000 ? 'FREE' : '₹50'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFulfilmentType('THIRD_PARTY_DELIVERY')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                    fulfilmentType === 'THIRD_PARTY_DELIVERY' ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-4 h-4 mb-1 text-slate-600" />
                  <span>Courier</span>
                  <span className="text-[10px] text-slate-500">₹90</span>
                </button>
              </div>
            </div>

            {/* Address fields (if delivery) */}
            {fulfilmentType !== 'PICKUP' && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-700">Delivery Address</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Recipient Full Name"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    required
                    className="p-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                  />
                  <input
                    type="tel"
                    placeholder="Contact Phone"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    required
                    className="p-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Street / House No."
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className="col-span-2 p-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={shippingAddress.pincode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            {/* Payment options */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-brand-600" /> Payment Preference
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${paymentMethod === 'CASH_ON_DELIVERY' ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200'}`}>
                  <input
                    type="radio"
                    name="payMethod"
                    value="CASH_ON_DELIVERY"
                    checked={paymentMethod === 'CASH_ON_DELIVERY'}
                    onChange={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className="text-brand-600"
                  />
                  <span>Cash on Delivery / Pickup</span>
                </label>
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${paymentMethod === 'ONLINE_UPI_CARD' ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200'}`}>
                  <input
                    type="radio"
                    name="payMethod"
                    value="ONLINE_UPI_CARD"
                    checked={paymentMethod === 'ONLINE_UPI_CARD'}
                    onChange={() => setPaymentMethod('ONLINE_UPI_CARD')}
                    className="text-brand-600"
                  />
                  <span>Online UPI / Card</span>
                </label>
              </div>
            </div>

            {/* Totals & Trust */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({quantity} item{quantity > 1 ? 's' : ''}):</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery:</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-slate-200 pt-1.5">
                <span>Total Payable:</span>
                <span className="text-brand-600">₹{total}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? 'Confirming Order...' : `Place Order • ₹${total}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OrderCheckoutModal;
