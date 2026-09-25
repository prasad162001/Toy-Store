import { gql } from 'graphql-request';

// AUTH MUTATIONS
export const SEND_OTP_MUTATION = gql`
  mutation SendOtp($input: SendOtpInput!) {
    sendOtp(input: $input) {
      success
      message
    }
  }
`;

export const VERIFY_OTP_MUTATION = gql`
  mutation VerifyOtp($input: VerifyOtpInput!) {
    verifyOtp(input: $input) {
      success
      message
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      user {
        id
        accountName
        mobile
        email
        roles
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        accountName
        mobile
        email
        roles
      }
    }
  }
`;

export const RESET_PIN_MUTATION = gql`
  mutation ResetPin($input: ResetPinInput!) {
    resetPin(input: $input) {
      success
      message
    }
  }
`;

// CATEGORIES & BANNERS QUERIES
export const GET_CATEGORIES_QUERY = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      description
      imageUrl
    }
  }
`;

export const GET_BANNERS_QUERY = gql`
  query GetBanners {
    banners {
      id
      title
      subtitle
      imageUrl
      ctaText
      ctaLink
      displayOrder
    }
  }
`;

// PRODUCTS QUERIES & MUTATIONS
export const GET_PRODUCTS_QUERY = gql`
  query GetProducts($filter: ProductFilterInput) {
    products(filter: $filter) {
      totalCount
      page
      totalPages
      products {
        id
        name
        slug
        description
        price
        discountPercent
        finalPrice
        recommendedAge
        isFeatured
        isNewArrival
        isBestSeller
        category {
          id
          name
          slug
        }
        images {
          id
          url
          isPrimary
        }
        inventory {
          stockQuantity
        }
        averageRating
        reviewCount
      }
    }
  }
`;

export const GET_PRODUCT_BY_SLUG_QUERY = gql`
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      specifications
      price
      discountPercent
      finalPrice
      recommendedAge
      isFeatured
      isNewArrival
      isBestSeller
      category {
        id
        name
        slug
      }
      images {
        id
        url
        isPrimary
      }
      inventory {
        stockQuantity
      }
      averageRating
      reviewCount
    }
  }
`;

// CART QUERIES & MUTATIONS
export const GET_CART_QUERY = gql`
  query GetCart($sessionId: String) {
    cart(sessionId: $sessionId) {
      id
      subtotal
      deliveryFee
      freeDeliveryThreshold
      grandTotal
      totalItems
      items {
        id
        productId
        quantity
        itemTotal
        product {
          id
          name
          slug
          price
          discountPercent
          finalPrice
          images {
            url
          }
          inventory {
            stockQuantity
          }
        }
      }
    }
  }
`;

export const ADD_TO_CART_MUTATION = gql`
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      id
      totalItems
      grandTotal
    }
  }
`;

export const UPDATE_CART_ITEM_MUTATION = gql`
  mutation UpdateCartItem($input: UpdateCartItemInput!, $sessionId: String) {
    updateCartItem(input: $input, sessionId: $sessionId) {
      id
      totalItems
      grandTotal
    }
  }
`;

export const REMOVE_CART_ITEM_MUTATION = gql`
  mutation RemoveCartItem($cartItemId: String!, $sessionId: String) {
    removeCartItem(cartItemId: $cartItemId, sessionId: $sessionId) {
      id
      totalItems
      grandTotal
    }
  }
`;

// ORDERS & CHECKOUT
export const VALIDATE_COUPON_QUERY = gql`
  query ValidateCoupon($code: String!, $subtotal: Float!) {
    validateCoupon(code: $code, subtotal: $subtotal) {
      isValid
      message
      discountAmount
    }
  }
`;

export const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      grandTotal
      status
    }
  }
`;

export const GET_MY_ORDERS_QUERY = gql`
  query GetMyOrders {
    myOrders {
      id
      orderNumber
      subtotal
      discount
      deliveryFee
      grandTotal
      status
      createdAt
      address {
        fullName
        street
        city
        state
        pincode
      }
      items {
        id
        productName
        unitPrice
        quantity
        totalPrice
        product {
          slug
          images {
            url
          }
        }
      }
      statusHistory {
        id
        status
        notes
        createdAt
      }
    }
  }
`;

export const GET_MY_ADDRESSES_QUERY = gql`
  query GetMyAddresses {
    myAddresses {
      id
      fullName
      mobile
      street
      city
      state
      pincode
      isDefault
    }
  }
`;

export const CREATE_ADDRESS_MUTATION = gql`
  mutation CreateAddress($input: CreateAddressInput!) {
    createAddress(input: $input) {
      id
      fullName
      mobile
      street
      city
      state
      pincode
      isDefault
    }
  }
`;

// WISHLIST
export const GET_MY_WISHLIST_QUERY = gql`
  query GetMyWishlist {
    myWishlist {
      id
      productId
      product {
        id
        name
        slug
        price
        discountPercent
        finalPrice
        images {
          url
        }
      }
    }
  }
`;

export const TOGGLE_WISHLIST_MUTATION = gql`
  mutation ToggleWishlist($productId: String!) {
    toggleWishlistItem(productId: $productId) {
      id
      productId
    }
  }
`;

// REVIEWS
export const GET_PRODUCT_REVIEWS_QUERY = gql`
  query GetProductReviews($productId: String!) {
    productReviews(productId: $productId) {
      id
      rating
      title
      comment
      createdAt
      user {
        accountName
      }
    }
  }
`;

export const CREATE_REVIEW_MUTATION = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      rating
      comment
    }
  }
`;

// ADMIN QUERIES & MUTATIONS
export const ADMIN_METRICS_QUERY = gql`
  query AdminMetrics {
    adminMetrics {
      totalProducts
      totalOrders
      totalUsers
      totalRevenue
      recentOrders {
        id
        orderNumber
        grandTotal
        status
        createdAt
        address {
          fullName
        }
      }
      lowStockProducts {
        id
        name
        inventory {
          stockQuantity
        }
      }
    }
  }
`;

export const ADMIN_ORDERS_QUERY = gql`
  query AdminOrders {
    adminOrders {
      id
      orderNumber
      grandTotal
      status
      createdAt
      address {
        fullName
        mobile
        street
        city
        pincode
      }
      items {
        productName
        quantity
        unitPrice
      }
    }
  }
`;

export const UPDATE_ORDER_STATUS_MUTATION = gql`
  mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
    updateOrderStatus(input: $input) {
      id
      status
    }
  }
`;

export const UPDATE_STOCK_MUTATION = gql`
  mutation UpdateStock($productId: String!, $stockQuantity: Int!, $reason: String) {
    updateStock(productId: $productId, stockQuantity: $stockQuantity, reason: $reason) {
      id
      stockQuantity
    }
  }
`;

export const ADMIN_USERS_QUERY = gql`
  query AdminUsers {
    adminUsers {
      id
      accountName
      mobile
      email
      roles
      isVerified
    }
  }
`;

export const ADMIN_AUDIT_LOGS_QUERY = gql`
  query AdminAuditLogs {
    adminAuditLogs {
      id
      action
      entity
      entityId
      metadata
      createdAt
      actor {
        accountName
        mobile
      }
    }
  }
`;
