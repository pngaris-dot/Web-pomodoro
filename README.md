# Web-pomodoro
Một web đồng hồ pomodoro có đổi hình nền (ảnh hoặc video), tùy chỉnh giao diện, ghi chú kèm checkbox và đường tắt tới Spotify, YouTube Music.

**Chức năng**
1. Đồng hồ Pomodoro
  3 chế độ: Focus (mặc định 25 phút), Short break (5 phút), Long break (15 phút).
  Nút Start / Pause để chạy và tạm dừng, nút Reset để đặt lại về đầu chế độ đang chọn.
  Chuyển chế độ thì đồng hồ tự dừng và về đúng số phút của chế độ mới.
  Hết giờ hiện thông báo.
2. Settings (tùy chỉnh giao diện)
  Đổi font chữ (Sans-serif, Serif, Monospace, Cursive).
  Đổi màu nền, màu nút, màu chữ bằng bảng chọn màu.
  Chỉnh số phút cho Focus, Short break, Long break (từ 1 đến 180 phút). Giá trị không hợp lệ sẽ tự trả về số cũ. Số phút mới áp dụng khi Reset hoặc chuyển chế độ, không làm nhảy số khi đồng hồ đang chạy.
3. Background (hình nền)
  Chọn nhanh trong lưới hình nền có sẵn: các video .mp4 bỏ trong thư mục static/backgrounds được Go tự quét và hiện thành ô xem trước.
  Tải lên ảnh (JPG, PNG, WEBP, GIF) hoặc video (MP4, WEBM), tối đa 200MB. Server kiểm tra nội dung thật của file chứ không chỉ nhìn đuôi tên file.
  Video nền chạy lặp, tắt tiếng, phủ kín màn hình. Ảnh nền phủ kín trang.
  Nút x ở góc ô để xóa hình đã tải lên. Hình có sẵn trong static/backgrounds không có nút xóa và server cũng từ chối xóa chúng.
  Ô None để bỏ hình nền, quay về màu nền thường.
  Hình nền đang chọn được nhớ lại khi tải lại trang.
4. Notes (ghi chú)
  Bấm + Note để tạo note mới, note mới nằm trên cùng.
  Mỗi note có ô gõ chữ tự do và danh sách checkbox có thể tick, chữ sẽ bị gạch khi đã xong.
  Khi đang gõ ở một dòng checkbox: Enter thêm dòng mới bên dưới, Backspace trên dòng trống thì xóa dòng đó.
  Xóa từng dòng hoặc xóa cả note (có hỏi xác nhận nếu note đã có nội dung).
  Mọi thay đổi tự lưu vào trình duyệt, tải lại trang vẫn còn.
5. Liên kết nhạc
  Hai nút tròn ở góc trái dưới mở Spotify và YouTube Music ở tab mới, đồng hồ vẫn chạy ở tab hiện tại.
