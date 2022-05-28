

const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    payment_method_types: ["card"],

});