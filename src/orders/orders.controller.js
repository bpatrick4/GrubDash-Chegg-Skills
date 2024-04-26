const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// middleware handlers

// check if order has a delivery address
function bodyHasDeliverProp(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;

  if (deliverTo) {
    res.locals.deliverTo = deliverTo;
    return next();
  }
  next({
    status: 400,
    message: `A 'deliverTo' property is required.` 
  });
}

// check if order has mobile number
function bodyHasMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;

  if (mobileNumber) {
    res.locals.mobileNumber = mobileNumber;
    return next();
  }
  next({
    status: 400,
    message: `A 'mobileNumber' property is required.` 
  });
}

// check if order has status
function bodyHasStatus(req, res, next) {
  const { data: { status } = {} } = req.body;

  if (status) {
    res.locals.status = status;
    return next();
  }
  next({
    status: 400,
    message: `A 'status' property is required.` 
  });
}

// check if status is valid
function bodyHasValidStatus(req, res, next) {
  const { data: { status } = {} } = req.body;

  if (
    status.includes("pending") ||
    status.includes("preparing") ||
    status.includes("out-for-delivery") ||
    status.includes("delivered")
  ) {
    res.locals.status = status;
    return next();
  }
  next({
    status: 400,
    message: `status property must be valid string: 'pending', 'preparing', 'out-for-delivery', or 'delivered'` 
  });
}

// check if order has at least one dish
function bodyHasDishesProp(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (dishes) {
    res.locals.dishes = dishes;
    return next();
  }
  next({
    status: 400,
    message: `A 'dishes' property is required.` 
  });
}

// check if the order's dish is valid
function bodyHasValidDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  
  if (!Array.isArray(res.locals.dishes) || res.locals.dishes.length == 0) {
    next({
      status: 400,
      message: `invalid dishes property: dishes property must be non-empty array`
    });
  }
  return next();
}

// check if the order's dish is valid
function bodyHasValidDishesLength(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  // check each dish
  dishes.forEach((dish) => {
    const quantity = dish.quantity
    
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `dish ${dish.id} must have quantity property, quantity must be an integer, and it must not be equal to or less than 0`,
      })
    };
  })
  return next();
}

// check if order exists in orders
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const matchingOrder = orders.find((order) => order.id === orderId);

  if (matchingOrder) {
    res.locals.matchingOrder = matchingOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found ${orderId}`,
  });
}

// check data id
function orderIdMatchesDataId(req, res, next) {
  const { data: { id } = {} } = req.body;
  const orderId = req.params.orderId;

  if (id !== "" && id !== orderId && id !== null && id !== undefined) {
    next({
      status: 400,
      message: `id ${id} must match dataId provided in parameters`
    });
  }
  return next();
}


// route handlers

// lists all orders
function list(req, res) {
  res.json({ data: orders });
}

// read a specific orderId
function read(req, res) {
  const orderId = req.params.orderId;
  const matchingOrder = orders.find((order) => order.id === orderId);
  res.json({ data: res.locals.matchingOrder});
}

// create a new order
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes: [] } = {} } = req.body;
  // new order object
  const newOrder ={
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes: [],
  };
  // add new order to orders
  orders.push(newOrder);
  // return new order object
  res.status(201).json({ data: newOrder });
}

// update an orderId
function update(req, res) {
  const orderId = req.params.orderId;
  // find order by Id
  const matchingOrder = orders.find((order) => order.id === orderId);
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    // update order
    matchingOrder.deliverTo = deliverTo;
    matchingOrder.mobileNumber = mobileNumber;
    matchingOrder.status = status;
    matchingOrder.dishes = dishes;
  // return new order data
  res.json({ data: matchingOrder})
}

// delete an order
function destroy(req, res, next) {
  const { orderId } = req.params;
  // find order by Id
  const matchingOrder = orders.find((order) => order.id === orderId);
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  if (matchingOrder.status === "pending") {
    const index = orders.findIndex((order) => order.id === Number(orderId));
    orders.splice(index, 1);
    res.sendStatus(204);
  }
  next({
    status: 400,
    message: `order cannot be deleted unless order status = 'pending'`,
  });
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyHasDeliverProp,
    bodyHasMobileNumber,
    bodyHasDishesProp,
    bodyHasValidDishes,
    bodyHasValidDishesLength,
    create
  ],
  update: [
    orderExists,
    orderIdMatchesDataId,
    bodyHasDeliverProp,
    bodyHasMobileNumber,
    bodyHasDishesProp,
    bodyHasStatus,
    bodyHasValidStatus,
    bodyHasValidDishes,
    bodyHasValidDishesLength,
    update
  ],
  delete: [orderExists, destroy]
};