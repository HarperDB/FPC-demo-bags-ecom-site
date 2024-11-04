const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Category = require("../models/category");
var moment = require("moment");

// GET: display all products
router.get("/", async (req, res) => {

  console.log("-------ALL PRODUCTS HIT-------")
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  try {
    const products = await Product.find({})
      .sort("-createdAt")
      .skip(perPage * page - perPage)
      .limit(perPage)
      .populate("category");

    const count = await Product.count();

    res.render("shop/index", {
      pageName: "All Products",
      products,
      successMsg,
      errorMsg,
      current: page,
      breadcrumbs: null,
      home: "/products/?",
      pages: Math.ceil(count / perPage),
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

// GET: search box
router.get("/search", async (req, res) => {

  console.log("-------SEARCH BOX HIT-------")
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];

  try {
    const products = await Product.find({
      title: { $regex: req.query.search, $options: "i" },
    })
      .sort("-createdAt")
      .skip(perPage * page - perPage)
      .limit(perPage)
      .populate("category")
      .exec();
    const count = await Product.count({
      title: { $regex: req.query.search, $options: "i" },
    });
    res.render("shop/index", {
      pageName: "Search Results",
      products,
      successMsg,
      errorMsg,
      current: page,
      breadcrumbs: null,
      home: "/products/search?search=" + req.query.search + "&",
      pages: Math.ceil(count / perPage),
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

//GET: get a certain category by its slug (this is used for the categories navbar)
router.get("/:slug", async (req, res) => {

  console.log("-------CATEGORY BY SLUG HIT-------")

  // TODO: This is hit when we call a catergory
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  const perPage = 8;
  let page = parseInt(req.query.page) || 1;
  try {
    const foundCategory = await Category.findOne({ slug: req.params.slug });
    const allProducts = await Product.find({ category: foundCategory.id })
      .sort("-createdAt")
      .skip(perPage * page - perPage)
      .limit(perPage)
      .populate("category");

    const count = await Product.count({ category: foundCategory.id });

    res.render("shop/index", {
      pageName: foundCategory.title,
      currentCategory: foundCategory,
      products: allProducts,
      successMsg,
      errorMsg,
      current: page,
      breadcrumbs: req.breadcrumbs,
      home: "/products/" + req.params.slug.toString() + "/?",
      pages: Math.ceil(count / perPage),
    });
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

// GET: display a certain product by its id
router.get("/:slug/:id", async (req, res) => {

  console.log("-------PRODUCT BY ID HIT-------")

  // TODO: EDIT THIS CODE
  const successMsg = req.flash("success")[0];
  const errorMsg = req.flash("error")[0];
  try {
    //const product = await Product.findById(req.params.id).populate("category");
    
    const product = await fetch(`http://localhost:9926/PageCache/backpacks?id=${req.params.id}`,

      {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache,' 
          //no-store, must-revalidate',  // Prevents caching
          //'Pragma': 'no-cache',                                     // HTTP/1.0 compatibility
          // 'Expires': '0'                                            // Forces immediate expiration
        }}
    );

    
    let productToJson = await product.json();
    
    let cachedresponse = productToJson.cachedData;

    console.log("CACHED RESPONSE",productToJson.statusCode);

    if (productToJson.statusCode ===  304) {
      console.log("CACHE HIT")
      res.setHeader('X-Cache-Status-HDB', "cache-hit");
      res.setHeader('Latency-cache-hit', productToJson.latency);
      res.status(304)

    }

    if (productToJson.statusCode ===  200) {
      console.log("CACHE MISS")
      res.setHeader('X-Cache-Status-HDB', "cache-miss");
      res.setHeader('Latency-cache-missed', productToJson.latency);
      
      res.status(200)

    }
   
    //cachedData;
    
    //const cacheStatus = product.headers.get('X-Cache-Status');

    // console.log("CACHE RESPONSE",product.headers);

    // res.setHeader('X-Cache-Status', cacheStatus);

    res.render("shop/product", {
      pageName: cachedresponse.title,
      cachedresponse,
      successMsg,
      errorMsg,
      moment: moment,
    });
  } catch (error) {
    console.log(error);
    return res.redirect("/");
  }
});

module.exports = router;
