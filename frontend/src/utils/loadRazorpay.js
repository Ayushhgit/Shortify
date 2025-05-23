export function loadRazorpayScript() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      console.log("Razorpay SDK loaded");
      resolve(true);
    };
    script.onerror = () => {
      console.error("Razorpay SDK failed to load");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
