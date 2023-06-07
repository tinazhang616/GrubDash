const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function dishExiste(req,res,next){
    const {dishId}=req.params;
    const dishFound = dishes.find((dish)=>dish.id==dishId);
    if(dishFound){
        res.locals.dish=dishFound;
        return next();
    }
    next({
        status:404,
        message:`Dish id does not match route id. Dish:, Route: ${dishId}`
    })
}
function bodyDataHas(propertyName){
    return function(req,res,next){
        const {data={}}=req.body;
        if(data[propertyName]){
            return next()
        }
        next({
            status: 400, message: `Dish must include a ${propertyName}` 
        })
    }}

function priceIsValid(req,res,next){
    const {data:{price}={}}=req.body;
    if(Number.isInteger(price) && price>0){
        return next()
    }
    next({
        status: 400, 
        message: "Dish must have a price that is an integer greater than 0"
    })
}

function list(req,res){
    res.json({data:dishes})
}
function read(req,res){
    res.json({data:res.locals.dish})
}
function update(req,res){
    const dish = res.locals.dish;
    const {data:{name,description,price,image_url}={}}=req.body;
    dish.name=name;
    dish.description=description;
    dish.price=price;
    dish.image_url=image_url;
    res.json({data:dish})
}
function create(req,res){
    const {data:{name,description,price,image_url}={}}=req.body;
    const newDish = {
        id:nextId(),
        name,
        description,
        price,
        image_url
    }
    dishes.push(newDish);
    res.status(201).json({data:{...newDish}})
}
function idCheck(req,res,next){
    const {data:{id}={}}=req.body;
    const {dishId}=req.params;
    if(!id||Number(id) === Number(dishId)){
        return next()
    }
    else if(id&&id !== Number(dishId)){
        next({ 
            status:400,
            message:`Dish id does not match route id. Order: ${id}, Route: ${dishId}.`})
    }
    next();
}

module.exports = {
    create:[
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValid,
        create],
    read:[
        dishExiste,
        read
    ],
    update:[dishExiste,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceIsValid,
        idCheck,
        update],
    list,
}