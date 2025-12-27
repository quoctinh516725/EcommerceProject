**TÀI LIỆU THIẾT KẾ DỰ ÁN CÁ NHÂN ECOMMERCE**

**1. Mục tiêu dự án**

Hệ thống là một **nền tảng thương mại điện tử đa người bán (Marketplace)** cho phép nhiều shop (seller) kinh doanh trên cùng một nền tảng với sản phẩm là đồ công nghệ. Người dùng có thể tìm kiếm, mua sắm, thanh toán trực tuyến; người bán quản lý sản phẩm và đơn hàng; đội ngũ vận hành giám sát nội dung và xử lý tranh chấp; admin quản trị toàn bộ hệ thống.

Hệ thống được thiết kế theo hướng:

- **Scalable** (mở rộng dễ dàng)
- **High Availability**
- **Secure by Design**
- **Phù hợp lượng truy cập lớn (high concurrency)**

**2. Các vai trò người dùng (User Roles)**

**2.1 Guest (Khách chưa đăng nhập)**

- Xem danh sách & chi tiết sản phẩm
- Tìm kiếm, lọc, sắp xếp
- Xem đánh giá, thông tin shop
- Thêm sản phẩm vào giỏ hàng tạm (local storage)
- Đăng ký / đăng nhập

**2.2 User (Người mua)**

- Quản lý hồ sơ cá nhân
- Quản lý địa chỉ giao hàng
- Giỏ hàng & đặt hàng
- Thanh toán online (VNPay, Momo, Stripe, PayPal…)
- Theo dõi trạng thái đơn hàng
- Đánh giá sản phẩm, shop
- Chat với seller
- Khiếu nại, yêu cầu hoàn tiền

**2.3 Seller (Người bán)**

- Đăng ký & quản lý shop
- CRUD sản phẩm, hình ảnh, giá, tồn kho
- Quản lý đơn hàng (xác nhận, đóng gói, giao hàng)
- Quản lý khuyến mãi, voucher shop
- Chat với khách hàng
- Xem báo cáo doanh thu
- Rút tiền

**2.4 Staff (Nhân viên vận hành)**

- Duyệt sản phẩm & nội dung vi phạm
- Xử lý khiếu nại, tranh chấp
- Khóa / mở shop hoặc tài khoản
- Can thiệp đơn hàng đặc biệt
- Hỗ trợ người dùng

**2.5 Admin (Quản trị hệ thống)**

- Quản lý user, seller, staff
- Quản lý role & permission
- Quản lý category, brand
- Cấu hình phí nền tảng
- Xem báo cáo tổng hệ thống
- Audit log & giám sát bảo mậ-----t

**3. Chức năng chính của hệ thống**

**I. Quản lý người dùng & phân quyền (User & Access Management)**

**1. Chức năng**

- Đăng ký / đăng nhập
- Đăng nhập OAuth (Google, Facebook)
- Quản lý hồ sơ cá nhân
- Quản lý vai trò: guest, user, seller, staff, admin
- Phân quyền chi tiết theo hành động (permission-based)

**2. Cách xây dựng**

- Authentication: JWT + Refresh Token
- Authorization: RBAC + Permission
- Middleware kiểm tra quyền theo API

**3. Công nghệ**

- Backend: NodeJS
- Password hash: bcrypt / argon2
- Token: JWT (access + refresh)
- DB: bảng users, roles, permissions, user\_roles, role\_permissions

**II. Quản lý sản phẩm & danh mục (Product Management)**

**1. Chức năng**

- CRUD sản phẩm
- Quản lý hình ảnh sản phẩm
- Danh mục đa cấp (category tree)
- Thuộc tính động (màu sắc, size, RAM, CPU…)
- Tìm kiếm, lọc, sắp xếp

**2. Cách xây dựng**

- Category dùng mô hình cây (Adjacency List hoặc Nested Set)
- Thuộc tính động dùng:
  - EAV (Entity–Attribute–Value)
- Tách product & product\_variant

**3. Công nghệ**

- DB: SQL server
- Search: ElasticSearch
- Image storage: Clondinary
- Cache product hot: Redis
-----
**III. Giỏ hàng (Shopping Cart)**

**1. Chức năng**

- Thêm / xóa / cập nhật sản phẩm trong giỏ
- Giỏ hàng cho guest & user
- Tính tổng tiền tạm thời

**2. Cách xây dựng**

- Guest: lưu giỏ hàng ở LocalStorage
- User:
  - Redis (session-based)
  - Hoặc DB (carts, cart\_items)
- Đồng bộ giỏ khi user login

**3. Công nghệ**

- Redis
- REST API
- Frontend: Redux Toolkit / RTK Query
-----
**IV. Đơn hàng (Order Management)**

**1. Chức năng**

- Tạo đơn hàng
- Một đơn → nhiều shop (split order)
- Theo dõi trạng thái đơn
- Hủy / hoàn tiền

**2. Cách xây dựng**

- Order master + order\_items
- Mỗi seller có sub-order
- State machine cho order status

**3. Công nghệ**

- Queue xử lý async (order, email)
-----
**V. Thanh toán (Payment System)**

**1. Chức năng**

- Thanh toán online (VNPay, Momo, Stripe)
- COD
- Ghi nhận lịch sử thanh toán
- Hoàn tiền

**VI. Vận chuyển & giao hàng (Shipping & Logistics)**

**1. Chức năng**

- Chọn đơn vị vận chuyển
- Theo dõi trạng thái giao hàng
- Cập nhật tracking
-----
**VII. Đánh giá & phản hồi (Review & Rating)**

**1. Chức năng**

- Đánh giá sản phẩm
- Chấm sao shop
- Report đánh giá xấu

**2. Cách xây dựng**

- Chỉ user đã mua mới được đánh giá
- Tính rating trung bình bằng cache

**3. Công nghệ**

- Redis cache
- Moderation bởi staff
-----
**VIII. Chat & thông báo (Chat & Notification)**

**1. Chức năng**

- Chat user ↔ seller
- Thông báo trạng thái đơn
- Email xác nhận

**2. Cách xây dựng**

- Realtime WebSocket
- Event-driven notification

**3. Công nghệ**

- Socket.IO / WebSocket
- Firebase / SMTP
-----
**IX. Khuyến mãi & Marketing**

**1. Chức năng**

- Voucher toàn sàn
- Voucher shop
- Flash sale
- Affiliate

**2. Cách xây dựng**

- Rule-based engine
- Voucher condition (time, user, limit)

**3. Công nghệ**

- Redis
- Background job
- Scheduler (cron)
-----
**X. Báo cáo & thống kê (Analytics & Report)**

**1. Chức năng**

- Doanh thu theo ngày/tháng
- Top sản phẩm
- Seller performance

**2. Cách xây dựng**

- Snapshot dữ liệu
- Pre-aggregation
-----
**XI. Quản trị & vận hành (Admin & Staff)**

**1. Chức năng**

- Duyệt sản phẩm
- Quản lý user, seller
- Audit log

**2. Cách xây dựng**

- Admin panel riêng
- Ghi log mọi hành động

**3. Công nghệ**

- RBAC
- ELK Stack

**4. Kiến trúc hệ thống (System Architecture): Monolith**

**5. Bảo mật hệ thống (Security)**

**5.1 Authentication & Authorization**

- JWT + Refresh Token
- OAuth2 (Google, Facebook)
- RBAC (Role-Based Access Control)
- Policy-based authorization

**5.2 Các biện pháp bảo mật**

- Hash password (bcrypt/argon2)
- Rate limiting
- CSRF / XSS / SQL Injection protection
- Audit log cho admin
- Phân quyền theo permission, không hardcode role

**6. Hiệu năng & chịu tải (Scalability)**

- Load Balancer (Nginx / Cloud LB)
- Horizontal scaling backend
- Redis cache (product, session)
- Database indexing & partitioning
- Async xử lý (order, email, notification)
- CDN cho hình ảnh & static assets

**7. Công nghệ sử dụng (Modern Tech Stack)**

**Frontend**

- React 
- Redux Toolkit / RTK Query
- Tailwind / Ant Design

**Backend**

- Node.js 
- RESTful API 
- Prisma / TypeORM

**8. Thiết kế cơ sở dữ liệu (Database Design)**

**I. USER – AUTH – ROLE – PERMISSION**

|**users**|
| :- |
|**id**|
|username|
|email|
|phone|
|password|
|full\_name|
|avatar\_url|
|gender|
|date\_of\_birth|
|status (active, inactive)|
|last\_login\_at|
|created\_at|
|updated\_at|

|**roles**|**permissions**|**user\_roles**|**role\_permissions**||||
| :- | :- | :- | :- | :- | :- | :- |
|**id**|**id**|**id**|**id**||||
|code (ADMIN, USER, GUESS, STAFF, SELLER)|code (CREATE\_USER, CREATE\_PRODUCT….)|user\_id|role\_id||||
|name|description|role\_id|permission\_id||||
|description|created\_at||||||
|created\_at|||||||
|**refresh\_tokens**|**oauth\_accounts**|**user\_addresses**|||||
|**id**|**id**|**id**|||||
|**user\_id FK**|**user\_id FK**|user\_id|||||
|token|provider (google, facebook)|receiver\_name|||||
|expired\_at|provider\_user\_id|receiver\_number|||||
|revoked|email|receiver\_address|||||
|created\_at|created\_at|created\_at|||||

**II.Shop & Seller**

||
| :- |

|id|
| :- |
|seller\_id (user\_id)|
|name|
|address|
|phone|
|slug|
|description|
|logo\_url|
|backgroung\_url|
|rating|
|total\_products|
|total\_orders|
|status (active, inactive, banned)|
|created\_at|
|updated\_at|

||
| :- |

**III. Product – Category – Attribute**

|**categories**|**products**|**product\_images**|**brands**||||
| :- | :- | :- | :- | :- | :- | :- |
|id|id|id|id||||
|parent\_id|shop\_id|**product\_id**|name||||
|name|category\_id|image\_url|||||
|slug|name||||||
|description|slug||||||
|level|description||||||
|sort\_order|thumbnail\_url||||||
|is\_active|original\_price||||||
||sold\_count||||||
||rating||||||
||status (active,inactive)||||||
||created\_at||||||
||updated\_at||||||
||**brand\_id**||||||
|**product\_variants**|**product\_attributes**|**attributes**|**CategoryAttribute**|**attribute\_values**|**product\_tags**||
|id|id|id|id|id|id||
|**product\_id**|**product\_variant\_id**|attribute\_name|category\_id|attribute\_id|**product\_id**||
|sku|attribute\_id|code|attribute\_id|value|tag||
|variant\_name|attribute\_value\_id||||||
|price|||||||
|stock|||||||
|weight|||||||
|status|||||||
**IV. CART – CHECKOUT**

|**carts**|**cart\_items**|
| :- | :- |
|id|id|
|user\_id|cart\_id|
|session\_id|product\_id|
|total\_amount|variant\_id|
|updated\_at|quantity|
||price|
||is\_selected|
||subtotal|

**V. ORDER – PAYMENT**

|**orders**|**Sub\_Orders**|**order\_items**|**payments**|**refunds**|
| :- | :- | :- | :- | :- |
|id|id|id|id|id|
|user\_id|order\_id|sub\_order\_id|order\_id|order\_item\_id|
|total\_amount|shop\_id|product\_id|user\_id|payment\_id|
|shipping\_fee|voucher\_id|variant\_id|payment\_method(Vnpay, Momo)|amount|
|platform\_voucher\_id|discount\_amount|product\_name|payment\_deadline|reason|
|platform\_discount\_amount|sub\_total|price|transaction\_id|status|
|order\_code|shipping\_fee|quantity|amount|processed\_at|
|order\_status(...)|order\_status|total\_price|status(...)||
|shipping\_address|sub\_order\_code||paid\_at||
|receiver\_name|||raw\_response||
|`  `receiver\_phone|||||
**VII. REVIEW – RATING – REPORT**

|**product\_reviews**|**shop\_reviews**|**review\_reports**|
| :- | :- | :- |
|id|id|id|
|product\_id|shop\_id|review\_id|
|user\_id|user\_id|user\_id (reporter)|
|order\_item\_id|rating|reason|
|parent\_id|comment|status|
|rating|created\_at|created\_at|
|comment|||
|helpful\_count|||
|images|||
|created\_at|||



**VIII. CHAT – NOTIFICATION**

|**conversations**|**messages**|**notifications**|
| :- | :- | :- |
|id|id|id|
|user\_id|conversation\_id|user\_id|
|shop\_id|sender\_id|title|
|created\_at|message\_type (text, image)|content|
||content|type|
||sent\_at|is\_read|
||read\_at|created\_at|

**IX. VOUCHER – PROMOTION – MARKETING**

|**vochers**|**flash\_sales**|**user\_vouchers**|
| :- | :- | :- |
|id|id|user\_id|
|shop\_id|product\_id|` `voucher\_id.|
|code|sale\_price|status ̣(used, unused)|
|voucher\_type|start\_time|used\_at|
|free\_shipping|end\_time||
|discount\_value|stock\_limit||
|min\_order\_value|||
|max\_discount|||
|usage\_limit|||
|used\_count|||
|user\_limit|||
|start\_date / end\_date|||
|status|||

**X. ADMIN – STAFF – AUDIT**

|**staff\_actions**|**audit\_logs**|**system\_settings**|
| :- | :- | :- |
|id|id|id|
|staff\_id|user\_id|key|
|action\_type|action|value|
|target\_type|ip\_address|description|
|target\_id|user\_agent||
|description|created\_at||
|created\_at|||

**9. STATE MACHINE**

**1. State Machine cho Đơn hàng (Orders & Sub-Orders)**

Hệ thống sử dụng mô hình **Master Order** và **Sub-Order**. Trạng thái của Master Order phụ thuộc vào trạng thái thanh toán và tổng hợp từ các Sub-Orders.

- **PENDING\_PAYMENT (Chờ thanh toán):** Trạng thái mặc định khi đơn hàng vừa được tạo.
- **PAID (Đã thanh toán):** Khách hàng đã thanh toán thành công qua cổng (VNPay, Momo...).
- **PROCESSING (Đang xử lý):** Seller đã xác nhận và đang đóng gói sản phẩm.
- **SHIPPING (Đang giao hàng):** Đơn vị vận chuyển đã lấy hàng và đang đi giao.
- **DELIVERED (Đã giao):** Shipper xác nhận giao hàng thành công.
- **COMPLETED (Hoàn thành):** Người mua xác nhận đã nhận hàng hoặc hết thời gian khiếu nại.
- **CANCELLED (Đã hủy):** Người mua hủy đơn (khi chưa giao) hoặc quá hạn thanh toán.
- **REFUNDED (Đã hoàn tiền):** Đơn hàng bị trả lại và tiền đã được trả về cho khách.

**Quy tắc chuyển đổi trạng thái tổng (Master Order):**

- Master Order chuyển thành **PAID** ngay khi bảng payments ghi nhận status = success.
- Master Order chỉ chuyển thành **COMPLETED** khi tất cả các Sub\_Orders con đều đạt trạng thái COMPLETED.
-----
**2. State Machine cho Thanh toán (Payments)**

Bảng payments cần quản lý chặt chẽ để đối soát với các cổng thanh toán online.

- **PENDING (Chờ):** Giao dịch được tạo trên hệ thống nhưng chưa chuyển hướng sang cổng thanh toán.
- **PROCESSING (Đang xử lý):** Người dùng đã được chuyển hướng sang VNPay/Momo nhưng chưa hoàn tất thao tác.
- **SUCCESS (Thành công):** Nhận được IPN/Webhook từ cổng thanh toán xác nhận tiền đã trừ.
- **FAILED (Thất bại):** Giao dịch bị lỗi hoặc người dùng hủy thao tác tại trang thanh toán.
- **EXPIRED (Quá hạn):** Quá thời gian payment\_deadline mà chưa nhận được tiền.
-----
**3. State Machine cho Hoàn tiền & Khiếu nại (Refunds & Disputes)**

Đây là phần quan trọng cho đội ngũ Staff xử lý tranh chấp giữa User và Seller.

- **REQUESTED (Đã yêu cầu):** User tạo yêu cầu hoàn tiền.
- **PENDING\_SELLER (Chờ Shop duyệt):** Shop xem xét yêu cầu trả hàng/hoàn tiền.
- **PROCESSING (Đang xử lý):** Staff can thiệp nếu có tranh chấp (Dispute).
- **APPROVED (Đã chấp nhận):** Staff hoặc Seller đồng ý hoàn tiền.
- **REJECTED (Từ chối):** Yêu cầu bị bác bỏ do không đủ bằng chứng.
- **REFUNDED (Đã hoàn tiền):** Tiền đã được chuyển trả về tài khoản gốc của khách.
-----
**4. State Machine cho Nội dung & Tài khoản (Moderation)**

Dành cho Staff giám sát nội dung và tài khoản.

**Sản phẩm (Products):**

- **PENDING\_APPROVAL:** Đang chờ Staff duyệt nội dung khi Seller đăng mới.
- **ACTIVE:** Sản phẩm hiển thị trên sàn và có thể mua sắm.
- **INACTIVE:** Seller tạm ẩn sản phẩm hoặc hết hàng.
- **BANNED:** Bị Staff khóa do vi phạm chính sách.

**Đánh giá (Reviews):**

- **PENDING:** Review mới được tạo, chờ staff hoặc hệ thống kiểm duyệt.
- **APPROVED:** Hiển thị công khai trên trang sản phẩm.
- **HIDDEN:** Bị ẩn do chứa nội dung nhạy cảm hoặc bị report.
-----
**5. State Machine cho Khuyến mãi (Vouchers)**

Kiểm soát vòng đời của các mã giảm giá toàn sàn và của shop.

- **ACTIVE:** Voucher đang trong thời gian start\_date và end\_date, còn số lượng usage\_limit.
- **EXPIRED:** Quá thời gian end\_date.
- **EXHAUSTED:** Đã hết lượt sử dụng (used\_count >= usage\_limit).
- **DISABLED:** BịAdmin hoặc Seller chủ động khóa sớm.

**KIẾN TRÚC & CÔNG NGHỆ (MASTER TECH STACK)**

- **Kiến trúc:** Monolith (Layered Architecture: Controller -> Service -> Repository).
- **Backend:** Node.js + ExpressJS
- **Database:** SQL server + Redis (Caching & Session).
- **ORM:** Prisma (Sử dụng Schema-first).
- **Frontend:** React.js (Vite) + Tailwind CSS + TypeScript
- **State Management:** Redux Toolkit (RTK Query), React Query (Tanstack)
- **Real-time:** Socket.io.
- **File Storage:** Cloudinary.

**CHIẾT XUẤT NGHIỆP VỤ QUAN TRỌNG (BUSINESS LOGIC)**

AI cần đặc biệt chú ý các logic "xương máu" sau:

- **Order Splitting:** Khi thanh toán 1 Master Order, hệ thống phải tự động tạo N Sub-Orders tương ứng với N Shops.
- **Cart Sync:** Khi User login, phải merge giỏ hàng từ LocalStorage vào Database.
- **Inventory Locking:** Giữ kho (stock) trong 15-30 phút khi đơn hàng ở trạng thái PENDING\_PAYMENT.
- **Review Verification:** Chỉ cho phép đánh giá nếu order\_item\_id tồn tại và đơn hàng đã ở trạng thái DELIVERED.

**CHI TIẾT SCHEMA & QUY TẮC ĐẶT TÊN**

- **Table names:** snake\_case (ví dụ: order\_items).
- **Column names:** snake\_case.
- **Code names:** camelCase.
- **Primary Keys:** UUID (để bảo mật dữ liệu).
- **Audit Columns:** Luôn có created\_at, updated\_at, deleted\_at (Soft delete).

**DANH SÁCH BIẾN MÔI TRƯỜNG (.env template)**

DATABASE\_URL=

JWT\_ACCESS\_SECRET=

JWT\_REFRESH\_SECRET=

CLOUDINARY\_URL=

VNPAY\_TMN\_CODE=

VNPAY\_HASH\_SECRET=

REDIS\_URL=

**LỘ TRÌNH PHÁT TRIỂN (DEVELOPMENT ROADMAP)**

1. **Giai đoạn 1:** Khởi tạo Source code, Prisma Schema và Module Auth (JWT).
1. **Giai đoạn 2:** Xây dựng Module Category & Product (EAV Pattern cho thuộc tính động).
1. **Giai đoạn 3:** Xây dựng Giỏ hàng và logic Tách đơn (Master-Sub).
1. **Giai đoạn 4:** Tích hợp thanh toán VNPay và xử lý Webhook.
1. **Giai đoạn 5:** Xây dựng hệ thống Review và Chat.
1. **Giai đoạn 6:** Admin Panel và Audit Log.

**10. Restfull API**

Hệ thống sử dụng kiến trúc **RESTful API**, xác thực qua **JWT (Access + Refresh Token)** và phân quyền dựa trên **RBAC (Role-Based Access Control)**.

**1. Nhóm Auth & Profile (Public & Authenticated)**

Quản lý xác thực người dùng và thông tin cá nhân.

||
| :- |

|**Method**|**Endpoint**|**Quyền hạn**|**Mô tả**|
| :- | :- | :- | :- |
|**POST**|/auth/register|Guest|Đăng ký tài khoản người dùng mới.|
|**POST**|/auth/login|Guest|Đăng nhập, trả về Access Token & Refresh Token.|
|**POST**|/auth/refresh-token|Authenticated|Làm mới Access Token bằng Refresh Token.|
|**POST**|/auth/logout|Authenticated|Đăng xuất, hủy bỏ token hiện tại.|
|**GET**|/profile|Authenticated|Lấy thông tin chi tiết hồ sơ người dùng hiện tại.|
|**PUT**|/profile|Authenticated|Cập nhật thông tin hồ sơ (Tên, giới tính, ngày sinh...).|
|**POST**|/profile/avatar|Authenticated|Tải lên và cập nhật ảnh đại diện.|
|**GET**|/profile/addresses|Authenticated|Lấy danh sách địa chỉ giao hàng.|
|**POST**|/profile/addresses|Authenticated|Thêm địa chỉ giao hàng mới.|
|**PUT**|/profile/addresses/:id|Authenticated|Cập nhật địa chỉ giao hàng cụ thể.|
|**DELETE**|/profile/addresses/:id|Authenticated|Xóa địa chỉ giao hàng.|

**2. Nhóm Sản Phẩm & Danh Mục (Public)**

Dành cho Guest/User tìm kiếm và khám phá sản phẩm.

|**Method**|**Endpoint**|**Quyền hạn**|**Mô tả**|
| :- | :- | :- | :- |
|**GET**|/categories|Public|Lấy cây danh mục sản phẩm đa cấp.|
|**GET**|/brands|Public|Lấy danh sách các thương hiệu đồ công nghệ.|
|**GET**|/products|Public|Tìm kiếm, lọc (theo giá, brand, rate) và phân trang sản phẩm.|
|**GET**|/products/:slug|Public|Xem chi tiết sản phẩm và các biến thể (Variants) qua Slug.|
|**GET**|/products/:id/reviews|Public|Lấy danh sách đánh giá của một sản phẩm.|
|**GET**|/shops/:id|Public|Xem thông tin chi tiết và danh sách sản phẩm của một Shop.|

**3. Nhóm Người Bán - Seller (Seller Role)**

Quản lý cửa hàng, sản phẩm và xử lý đơn hàng theo từng Shop.

|**Method**|**Endpoint**|**Quyền hạn**|**Mô tả**|
| :- | :- | :- | :- |
|**POST**|/shop/register|User|Đăng ký mở Shop (Trạng thái ban đầu: pending).|
|**GET**|/shop/dashboard|Seller|Thống kê doanh thu, số đơn, sản phẩm bán chạy của Shop.|
|**POST**|/shop/products|Seller|Tạo sản phẩm mới (bao gồm Attributes & Variants).|
|**PUT**|/shop/products/:id|Seller|Chỉnh sửa thông tin sản phẩm và biến thể.|
|**DELETE**|/shop/products/:id|Seller|Ẩn hoặc xóa sản phẩm.|
|**GET**|/shop/sub-orders|Seller|Danh sách đơn hàng con thuộc quản lý của Shop.|
|**GET**|/shop/sub-orders/:id|Seller|Xem chi tiết một đơn hàng con.|
|**PATCH**|/shop/sub-orders/:id/status|Seller|Chuyển đổi trạng thái đơn (Xác nhận -> Đóng gói -> Giao hàng).|
|**POST**|/shop/vouchers|Seller|Tạo mã giảm giá riêng áp dụng cho sản phẩm của Shop.|

**4. Nhóm Giỏ Hàng & Thanh Toán (User Role)**

Quy trình giao dịch từ giỏ hàng đến khi hoàn tất thanh toán Master-Sub Order.

|**Method**|**Endpoint**|**Quyền hạn**|**Mô tả**|
| :- | :- | :- | :- |
|**GET**|/cart|User|Lấy danh sách items trong giỏ hàng từ Database.|
|**POST**|/cart/add|User|Thêm biến thể sản phẩm vào giỏ hàng.|
|**PUT**|/cart/items/:id|User|Cập nhật số lượng hoặc trạng thái chọn (is\_selected).|
|**DELETE**|/cart/items/:id|User|Xóa sản phẩm khỏi giỏ hàng.|
|**POST**|/checkout/preview|User|Tính toán tổng tiền, phí ship đa kho và áp dụng thử Voucher.|
|**POST**|/orders|User|Tạo đơn hàng tổng (Master) và tự động tách các đơn con (Sub).|
|**GET**|/orders/:id|User|Xem trạng thái đơn hàng tổng và tiến độ các đơn con.|
|**POST**|/payments/create-url|User|Tạo liên kết thanh toán (VNPay/Momo) cho Master Order.|
|**GET**|/payments/callback|Public|Webhook tiếp nhận kết quả thanh toán từ bên thứ ba.|

**5. Nhóm Đánh Giá & Tương Tác (User Role)**

Phản hồi sau mua hàng và kênh chat Real-time.

|**Method**|**Endpoint**|**Quyền hạn**|**Mô tả**|
| :- | :- | :- | :- |
|**POST**|/reviews/product|User|Đánh giá sản phẩm (Yêu cầu order\_item\_id đã giao).|
|**POST**|/reviews/shop|User|Đánh giá dịch vụ tổng thể của Shop.|
|**GET**|/conversations|Authenticated|Lấy danh sách các cuộc hội thoại chat.|
|**GET**|/conversations/:id/messages|Authenticated|Lấy lịch sử tin nhắn trong một cuộc hội thoại.|
|**POST**|/messages|Authenticated|Gửi tin nhắn (Tích hợp Socket.IO cho realtime).|
|**GET**|/notifications|Authenticated|Danh sách thông báo (Khuyến mãi, Trạng thái đơn hàng).|
|**PATCH**|/notifications/:id/read|Authenticated|Đánh dấu thông báo đã xem.|

**6. Nhóm Quản Trị & Vận Hành (Admin & Staff)**

Giám sát toàn bộ sàn, duyệt nội dung và xử lý tranh chấp.

|**Method**|**Endpoint**|**Quyền hạn**|**Mô tả**|
| :- | :- | :- | :- |
|**GET**|/admin/products/pending|Staff/Admin|Danh sách sản phẩm đang chờ duyệt nội dung.|
|**PATCH**|/admin/products/:id/approve|Staff/Admin|Duyệt hoặc từ chối (bắt buộc kèm lý do) sản phẩm.|
|**PATCH**|/admin/shops/:id/status|Admin|Khóa/Mở tài khoản Shop dựa trên báo cáo vi phạm.|
|**GET**|/admin/audit-logs|Admin|Truy xuất nhật ký hành động của nhân viên và hệ thống.|
|**POST**|/admin/vouchers|Admin|Tạo Voucher toàn sàn (Platform Voucher).|
|**GET**|/admin/settings|Admin|Lấy các cấu hình tĩnh (Logo, Phí sàn, Hotline).|
|**PATCH**|/admin/settings|Admin|Cập nhật cấu hình hệ thống.|
|**GET**|/admin/disputes|Staff|Danh sách các khiếu nại/yêu cầu hoàn tiền đang chờ xử lý.|
|**POST**|/admin/disputes/:id/resolve|Staff|Phán quyết khiếu nại (Hoàn tiền cho khách hoặc trả tiền cho shop).|

