const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");


function statusPropertyIsValid(req,res,next){
    const {data:{status}={}}=req.body;
    if(status&& status!=="invalid"){
       next()
    }else if(status==="delivered"){
        return next({
            status:400,
            message:`A delivered order cannot be changed`
        })
    }
    next({
        status:400,
        message:`Order must have a status of pending, preparing, out-for-delivery, delivered`
    })
}
function bodyHasData(propertyName){
    return function (req,res,next){
        const {data={}}=req.body;
        if(data[propertyName]){
            return next()
        }
        next({
            status: 400, message: `Order must include a ${propertyName}`
        })
    }
}
function dishesPropertyIsValid(req,res,next){
    const {data:{dishes}={}}=req.body;
    if(dishes){
        if(Array.isArray(dishes)&&dishes.length>0){
            return next()
        }else{
            next({
                status: 400, message:"Order must include at least one dish"
            })
        }
    }
    else{
        next({status: 400, message:"Order must include a dish" })
    }
}
function quantityPropertyIsValid(req,res,next){
    const {data:{dishes}={}}=req.body;
    const index = dishes.findIndex((dish)=>!Number.isInteger(dish.quantity)||!dish.quantity>0)
    if(index>-1){
        next({
            status:400,
            message:`Dish ${index} must have a quantity that is an integer greater than 0`
        })
    }
    next()
}
function list(req,res){
    res.json({data:orders})
}
function read(req,res){
    res.json({data:res.locals.order})
}
function orderExists(req,res,next){
    const { orderId }=req.params;
    const orderFound = orders.find((order)=>order.id == orderId);
    if(orderFound){
        res.locals.order = orderFound;
        return next();
    }
    next({
        status:404,
        message:`Order id does not match route id. Order: Route: ${orderId}.`
    })
}
function idCheck(req,res,next){
    const {data:{id}={}}=req.body;
    const {orderId}=req.params;
    if(!id||Number(id) === Number(orderId)){
        return next()
    }
    else if(id&&id !== Number(orderId)){
        next({ 
            status:400,
            message:`Order id does not match route id. Order: ${id}, Route: ${orderId}.`})
    }
    next();
}
function update(req,res,next){
    const {data:{deliverTo,mobileNumber,status,dishes}={}}=req.body;
    const order = res.locals.order;
    order.deliverTo=deliverTo;
    order.mobileNumber=mobileNumber;
    order.status=status;
    order.dishes=dishes;

    res.json({data:order})
    
}
function create(req,res){
    const {data:{deliverTo,mobileNumber,dishes}={}}=req.body;
    const newOrder = {
        id:nextId(),
        deliverTo,
        mobileNumber,
        status:null,
        // need to add quantity into dishes
        dishes
    }
    orders.push(newOrder)
    res.status(201).json({data:{...newOrder}})

}
function destroy(req,res,next){
    const order = res.locals.order;
    if(order.status !== "pending"){
        return next({
            status:400,
            message:"An order cannot be deleted unless it is pending."
        })
    }
    const {orderId}=req.params;
    const index=orders.findIndex(order=>order.id == orderId)
    const deletedOrders = orders.splice(index,1)
    res.sendStatus(204);
}

// TODO: Implement the /orders handlers needed to make the tests pass
module.exports={
    list,
    read:[orderExists,read],
    create:[
        bodyHasData("deliverTo"),
        bodyHasData("mobileNumber"),
        dishesPropertyIsValid,
        quantityPropertyIsValid,
        create
    ],
    update:[
        orderExists,
        bodyHasData("deliverTo"),
        bodyHasData("mobileNumber"),
        dishesPropertyIsValid,
        quantityPropertyIsValid,
        statusPropertyIsValid,
        idCheck,
        update],
    delete:[orderExists,destroy],
}
