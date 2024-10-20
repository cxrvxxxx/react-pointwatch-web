import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Card, Row, Col, Form, FloatingLabel, InputGroup, Toast,ToastContainer} from "react-bootstrap"; /* prettier-ignore */

import { register } from "../../api/auth";
import { isEmpty, isValidLength, isValidEmail, isValidPassword } from "../../common/validation/utils"; /* prettier-ignore */

import styles from "./style.module.css";
import BtnPrimary from "../../common/buttons/BtnPrimary";
import logo from "../../images/logo1.png";

const Registration = () => {
  const [isClicked, setIsClicked] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleShow = () => setShowToast(!showToast);

  const [form, setForm] = useState({
    email: "",
    employee_id: "",
    firstname: "",
    lastname: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const passwordsMatch = () => {
    return form.password === form.confirmPassword;
  };

  const invalidFields = () => {
    const requiredFields = [
      "email",
      "employee_id",
      "firstname",
      "lastname",
      "password",
      "confirmPassword",
    ];
    return (
      requiredFields.some((field) => isEmpty(form[field])) ||
      !isValidEmail(form.email) ||
      !isValidLength(form.employee_id, 1) ||
      !isValidLength(form.firstname, 1) ||
      !isValidLength(form.lastname, 1) ||
      !isValidPassword(form.password) ||
      !passwordsMatch()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsClicked(true);
    setIsProcessing(true);

    if (invalidFields()) {
      setErrorMessage("Please check the details again.");
      setIsClicked(false);
      setIsProcessing(false);
      return;
    }

    await register(
      form,
      (response) => {
        setTimeout(() => {
          setIsRegistrationComplete(true);
          setIsClicked(false);
          setIsProcessing(false);
        });
      },
      (error) => {
        if (error.response && error.response.status === 409) {
          setErrorMessage(<b>{error.response.data.error}</b>);
          setShowToast(true);
        }
        setIsProcessing(false);
      }
    );
  };

  return (
    <div className={styles.background}>
      <header className={`${styles.header} mb-3`}>
        <h3 className="text-white">
          <Link to="/login">
            <i
              className={`${styles.triangle} fa-solid fa-caret-left fa-xl`}></i>
          </Link>{" "}
          Create Account
        </h3>
      </header>

      {/* Error Toast */}
      <ToastContainer className="p-3" position="top-end">
        <Toast
          className={styles.toast}
          show={showToast}
          delay={5000}
          onClose={toggleShow}
          autohide>
          <Toast.Header className={styles.toastHeader}>
            <img
              src={logo}
              className={styles.image}
              height="20px"
              alt="PointWatch logo"
            />
            <strong className={`${styles.errorHeader} me-auto`}>
              Registration Error
            </strong>
          </Toast.Header>
          <Toast.Body>{errorMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Registration Form */}
      <Container className="d-flex justify-content-center align-items-center">
        <Card className="w-75 p-lg-4 p-2">
          {!isRegistrationComplete ? (
            <Card.Body>
              <Row className="mb-4">
                <Col className="text-center align-items-center justify-content-center">
                  <img
                    src={logo}
                    className="logo"
                    height="70px"
                    alt="PointWatch logo"
                  />
                  <span className={styles.brand}>PointWatch</span>
                </Col>
              </Row>
              <Form className={styles.form} noValidate>
                {/* Row 1: Email & ID Number */}
                <Row>
                  <Col lg={6} md={12} xs={12}>
                    <Form.Group className="mb-3" controlId="inputEmail">
                      <InputGroup hasValidation>
                        <InputGroup.Text className={styles.iconBox}>
                          <i
                            className={`${styles.formIcon} fa-solid fa-at fa-lg`}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="email"
                          value={form.email}
                          name="email"
                          onChange={handleChange}
                          placeholder="E-mail"
                          isInvalid={
                            !isEmpty(form.email) && !isValidEmail(form.email)
                          }
                        />
                        {!isEmpty(form.email) && !isValidEmail(form.email) && (
                          <Form.Control.Feedback type="invalid">
                            <>E-mail must be valid.</>
                          </Form.Control.Feedback>
                        )}
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col lg={6} md={12} xs={12}>
                    <Form.Group className="mb-3" controlId="inputEmployeeID">
                      <InputGroup hasValidation>
                        <InputGroup.Text className={styles.iconBox}>
                          <i
                            className={`${styles.formIcon} fa-solid fa-id-badge fa-lg`}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          value={form.employee_id}
                          name="employee_id"
                          onChange={handleChange}
                          placeholder="Employee ID"
                          isInvalid={
                            !isEmpty(form.employee_id) &&
                            !isValidLength(form.employee_id, 1)
                          }
                        />
                        {!isEmpty(form.employee_id) &&
                          !isValidLength(form.employee_id, 1) && (
                            <Form.Control.Feedback type="invalid">
                              <>Employee ID must be valid.</>
                            </Form.Control.Feedback>
                          )}
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Row 2: First name & last name  */}
                <Row>
                  <Col md={6} xs={12}>
                    <Form.Group className="mb-3" controlId="inputFirstname">
                      <InputGroup hasValidation>
                        <InputGroup.Text className={styles.iconBox}>
                          <i
                            className={`${styles.formIcon} fa-solid fa-user fa-lg`}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          value={form.firstname}
                          name="firstname"
                          onChange={handleChange}
                          placeholder="First name"
                          isInvalid={
                            !isEmpty(form.firstname) &&
                            !isValidLength(form.firstname, 1)
                          }
                        />
                        {!isEmpty(form.firstname) &&
                          !isValidLength(form.firstname, 1) && (
                            <Form.Control.Feedback type="invalid">
                              <>First name is too short.</>
                            </Form.Control.Feedback>
                          )}
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6} xs={12}>
                    <Form.Group className="mb-3" controlId="inputLastname">
                      <InputGroup hasValidation>
                        <InputGroup.Text className={styles.iconBox}>
                          <i
                            className={`${styles.formIcon} fa-solid fa-user fa-lg`}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          value={form.lastname}
                          name="lastname"
                          onChange={handleChange}
                          placeholder="Last name"
                          isInvalid={
                            !isEmpty(form.lastname) &&
                            !isValidLength(form.lastname, 1)
                          }
                        />
                        {!isEmpty(form.lastname) &&
                          !isValidLength(form.lastname, 1) && (
                            <Form.Control.Feedback type="invalid">
                              Last name is too short.
                            </Form.Control.Feedback>
                          )}
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Row 4 & 5: Password */}
                <Row>
                  <Col>
                    <Form.Group className="mb-3" controlId="inputPassword">
                      <InputGroup>
                        <InputGroup.Text className={styles.iconBox}>
                          <i
                            className={`${styles.formIcon} fa-solid fa-lock fa-lg`}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          className={styles.passwordBox}
                          name="password"
                          onChange={handleChange}
                          placeholder="Password"
                          isInvalid={
                            !isEmpty(form.password) &&
                            !isValidPassword(form.password)
                          }
                        />
                        <InputGroup.Text className={styles.iconEye}>
                          <i
                            className={`${styles.icon} ${
                              showPassword
                                ? "fa-solid fa-eye fa-lg"
                                : "fa-solid fa-eye-slash fa-lg"
                            }`}
                            onClick={() => setShowPassword(!showPassword)}></i>
                        </InputGroup.Text>
                        {!isEmpty(form.password) &&
                          !isValidPassword(form.password) && (
                            <Form.Control.Feedback type="invalid">
                              Must have at least 8 characters, one special
                              character, and one number.
                            </Form.Control.Feedback>
                          )}
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <Form.Group
                      className="mb-3"
                      controlId="inputConfirmPassword">
                      <InputGroup>
                        <InputGroup.Text className={styles.iconBox}>
                          <i
                            className={`${styles.formIcon} fa-solid fa-lock fa-lg`}></i>
                        </InputGroup.Text>
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          className={styles.passwordBox}
                          placeholder="Confirm Password"
                          name="confirmPassword"
                          onChange={handleChange}
                          isInvalid={!passwordsMatch()}
                        />
                        <InputGroup.Text className={styles.iconEye}>
                          <i
                            className={`${styles.icon} ${
                              showConfirmPassword
                                ? "fa-solid fa-eye fa-lg"
                                : "fa-solid fa-eye-slash fa-lg"
                            }`}
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }></i>
                        </InputGroup.Text>
                        {!isEmpty(form.password) && (
                          <Form.Control.Feedback type="invalid">
                            Passwords do not match.
                          </Form.Control.Feedback>
                        )}
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col className="text-center">
                    <BtnPrimary
                      onClick={handleSubmit}
                      disabled={invalidFields() || isProcessing} // Disable when processing or fields are invalid
                      title={
                        invalidFields() ? "Please check the details again." : ""
                      }>
                      {isProcessing ? ( // Show spinner when processing
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"></span>
                      ) : (
                        "Register"
                      )}
                    </BtnPrimary>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          ) : (
            <Card.Body>
              <Row>
                <Col className="text-center mb-3">
                  <span className={styles.brand}>Registration successful!</span>{" "}
                </Col>
              </Row>
              <Row>
                <Link to="/login">
                  <Col className="text-center">
                    <BtnPrimary>Proceed to Login</BtnPrimary>
                  </Col>
                </Link>
              </Row>
            </Card.Body>
          )}
        </Card>
      </Container>
    </div>
  );
};

export default Registration;
