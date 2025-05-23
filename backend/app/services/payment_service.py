from app.core.config import client
import razorpay

def create_order(amount_in_rupees: int, currency="INR", receipt="receipt_001", notes=None):
    amount = amount_in_rupees * 100  # Razorpay takes amount in paise
    data = {
        "amount": amount,
        "currency": currency,
        "receipt": receipt,
        "payment_capture": 1,
    }
    if notes:
        data["notes"] = notes

    return client.order.create(data=data)

def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    params_dict = {
        'razorpay_order_id': order_id,
        'razorpay_payment_id': payment_id,
        'razorpay_signature': signature
    }

    try:
        client.utility.verify_payment_signature(params_dict)
        return True
    except razorpay.errors.SignatureVerificationError:
        return False

