require('dotenv').config({path: "../../.env"})
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_API_KEY);
const {model: User} = require("../../models/user_schema");

const viewProfile = async (email) => {
    return await User.find({email: email})
        .then((data) => {
            if (data) {
                return data
            }
        })
}

const createCustomer = async (data) => {
    // First I find the profile with the email matching the one entered in the form
    return await viewProfile(data.email).then(async (userRes) => {
        userRes = userRes[0]
        // Create a stripe user from this email, passing the transaction token from the form
        return await stripe.customers.create({
            name: `${userRes.firstName} ${userRes.lastName}`,
            email: data.email,
            source: data.token
        }).then(async (stripeRes) => {
            // stripe_details object will so far be empty, having been left with a type of 'any' and ignored by faker
            return await User.findOneAndUpdate({email: data.email}, {stripe_details: {...stripeRes}}, {
                new: true,
            })
                .then((data) => {
                    if (data) {
                        // Updated the customer object to include the stripe data
                        return data;
                    }
                })
        })
    }).then((res) => res)
        .catch(e => console.log(e))
}


const charge = async (req, res) => {
    let token = req.body.stripeToken
    let {price, subscription_type, email} = req.body;
    await createCustomer({
        email: email,
        token: token
    }).then(async (response) => {
        let stripeDetails = response.stripe_details

        await stripe.charges.create({
            // Doesn't support floats and receives value in cents
            amount: parseInt(price) * 100,
            currency: 'eur',
            description: `${subscription_type}`,
            customer: stripeDetails.id
        }).then((stripeResponse) => res.status(200).json({
            stripeResponse
        }))
            .catch((e) => e)
    }).catch((e) => e)


}

module.exports = {charge, createCustomer}