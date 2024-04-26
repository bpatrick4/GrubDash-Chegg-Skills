const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// middleware handlers

// check if dish has a name property
function bodyHasName(req, res, next) {
  const { data: { name } = {} } = req.body;

  if (name) {
    res.locals.name = name;
    return next();
  }
  next({
    status: 400,
    message: `A 'name' property is required.` 
  });
}

// check if dish has description
function bodyHasDescription(req, res, next) {
  const { data: { description } = {} } = req.body;

  if (description) {
    res.locals.description = description;
    return next();
  }
  next({
    status: 400,
    message: `A 'description' property is required.` 
  });
}

// check if dish has price
function bodyHasPrice(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (price) {
    res.locals.price = price;
    return next();
  }
  next({
    status: 400,
    message: `A 'price' property is required.` 
  });
}

// check if dish price is valid
function bodyHasValidPrice(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (price > -1) {
    res.locals.price = price;
    return next();
  }
  next({
    status: 400,
    message: `price cannot be less than 0.`,
  });
}

// check if dish price is valid for update
function bodyHasValidPriceForUpdate(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (res.locals.price <= 0 || typeof res.locals.price !== "number") {
    next({
      status: 400,
      message: `price must be an integer greater than $0.`,
    });
  }
  res.locals.price = price;
  return next();
}

// check if dish has img
function bodyHasImg(req, res, next) {
  const { data: { image_url } = {} } = req.body;

  if (image_url) {
    res.locals.image_url = image_url;
    return next();
  }
  next({
    status: 400,
    message: `An 'image_url' property is required.` 
  });
}

// check if dish exists in dishes
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const matchingDish = dishes.find((dish) => dish.id === dishId);

  if (matchingDish) {
    res.locals.matchingDish = matchingDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found ${dishId}`,
  });
}

// check data id
function dishIdMatchesDataId(req, res, next) {
  const { data: { id } = {} } = req.body;
  const dishId = req.params.dishId;

  if (id !== "" && id !== dishId && id !== null && id !== undefined) {
    next({
      status: 400,
      message: `id ${id} must match dataId provided in parameters`
    })
  }
  return next();
}


// route handlers

// lists all dishes
function list(req, res) {
  res.json({ data: dishes });
}

// read a specific dishId
function read(req, res) {
  const dishId = req.params.dishId;
  const matchingDish = dishes.find((dish) => dish.id === dishId);
  res.json({ data: res.locals.matchingDish});
}

// create a new dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  // new dish object
  const newDish ={
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  // add new dish to dishes
  dishes.push(newDish);
  // return new dish object
  res.status(201).json({ data: newDish });
}

// update a dishId
function update(req, res) {
  const dishId = req.params.dishId;
  // find dish by Id
  const matchingDish = dishes.find((dish) => dish.id === dishId);
  const { data: { name, description, price, image_url } = {} } = req.body;
    // update dish
  matchingDish.name = name;
  matchingDish.description = description;
  matchingDish.price = price;
  matchingDish.image_url = image_url;
  // return new dish data
  res.json({ data: matchingDish})
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [
    bodyHasName,
    bodyHasDescription,
    bodyHasPrice,
    bodyHasValidPrice,
    bodyHasImg,
    create
  ],
  update: [
    dishExists,
    dishIdMatchesDataId,
    bodyHasName,
    bodyHasDescription,
    bodyHasPrice,
    bodyHasValidPriceForUpdate,
    bodyHasImg,
    update
  ],
};