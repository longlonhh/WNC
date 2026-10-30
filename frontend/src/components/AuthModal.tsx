import { useState, type FormEvent } from "react";
import { Modal, Form, Button, Alert, Nav, Spinner } from "react-bootstrap";
import { login, register, errorMessage, type SessionUser } from "@/lib/api";

/** 3 tài khoản mẫu có sẵn trong database (password: 123456) */
const DEMO_ACCOUNTS = [
  { label: "Khách hàng", email: "khach@cinema.vn" },
  { label: "Nhân viên soát vé", email: "staff@cinema.vn" },
  { label: "Quản trị viên", email: "admin@cinema.vn" },
];

type Props = {
  show: boolean;
  onHide: () => void;
  onAuthed: (user: SessionUser) => void;
};

/**
 * Hộp thoại đăng nhập / đăng ký.
 * Có nút "dùng tài khoản mẫu" để không phải gõ gì cả (giảm thao tác cho người dùng).
 */
export default function AuthModal({ show, onHide, onAuthed }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function reset(next: "login" | "register") {
    setTab(next);
    setError("");
  }

  function fillDemo(emailValue: string) {
    setTab("login");
    setEmail(emailValue);
    setPassword("123456");
    setError("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!email.includes("@")) return setError("Vui lòng nhập email hợp lệ.");
    if (password.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự.");
    if (tab === "register") {
      if (fullName.trim().length < 2) return setError("Vui lòng nhập họ tên.");
      if (phone && !/^0\d{9}$/.test(phone)) return setError("Số điện thoại phải đủ 10 chữ số, bắt đầu bằng 0.");
    }

    setBusy(true);
    setError("");
    try {
      const user =
        tab === "login"
          ? await login(email.trim(), password)
          : await register({
              fullName: fullName.trim(),
              email: email.trim(),
              password,
              ...(phone ? { phone } : {}),
            });
      onAuthed(user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal show={show} centered onHide={onHide}>
      <Modal.Header closeButton>
        <Nav variant="pills" activeKey={tab} className="w-100">
          <Nav.Item className="flex-fill">
            <Nav.Link eventKey="login" onClick={() => reset("login")} className="text-center">
              Đăng nhập
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="flex-fill">
            <Nav.Link eventKey="register" onClick={() => reset("register")} className="text-center">
              Đăng ký
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small mb-3">
          Chỉ cần đăng nhập <strong>1 lần</strong>, phiên được giữ tự động cho các lần đặt vé sau.
        </p>

        <Form onSubmit={submit}>
          {tab === "register" && (
            <Form.Group className="mb-3">
              <Form.Label>Họ tên</Form.Label>
              <Form.Control
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@email.com"
              autoComplete="email"
            />
          </Form.Group>

          {tab === "register" && (
            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại (không bắt buộc)</Form.Label>
              <Form.Control
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                inputMode="numeric"
                autoComplete="tel"
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Mật khẩu</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
            />
          </Form.Group>

          {error && <Alert variant="danger" className="py-2">{error}</Alert>}

          <Button type="submit" className="btn-bk w-100 py-2" disabled={busy}>
            {busy ? <Spinner size="sm" animation="border" className="me-2" /> : null}
            {tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </Button>
        </Form>

        <div className="mt-4 pt-3 border-top">
          <div className="small text-muted mb-2">Tài khoản mẫu (mật khẩu 123456) — bấm để điền nhanh:</div>
          <div className="d-flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <Button key={a.email} size="sm" variant="outline-secondary" onClick={() => fillDemo(a.email)}>
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
