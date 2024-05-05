import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate, useParams } from "react-router-dom";
import { Row, Col, Container, Card, Form, FloatingLabel, Button, ListGroup, Badge } from "react-bootstrap"; /* prettier-ignore */

import categories from "../../data/categories.json";
import roles from "../../data/roles.json";

import { isEmpty, isValidDate } from "../../common/validation/utils";
import { useSwitch } from "../../hooks/useSwitch";
import { useTrigger } from "../../hooks/useTrigger";
import { getSWTD, editSWTD } from "../../api/swtd";
import { getComments, postComment, deleteComment } from "../../api/comments"; /* prettier-ignore */

import BtnPrimary from "../../common/buttons/BtnPrimary";
import BtnSecondary from "../../common/buttons/BtnSecondary";
import CommentModal from "../../common/modals/CommentModal";
import ConfirmationModal from "../../common/modals/ConfirmationModal";
import styles from "./style.module.css";

const EditSWTD = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = Cookies.get("userToken");

  const [swtd, setSWTD] = useState(null);
  const [form, setForm] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const [selectedComment, setSelectedComment] = useState(null);
  const [showModal, openModal, closeModal] = useSwitch();
  const [showCommentModal, openCommentModal, closeCommentModal] = useSwitch();

  const [isEditing, enableEditing, cancelEditing] = useSwitch();

  const [showSuccess, triggerShowSuccess] = useTrigger(false);
  const [showError, triggerShowError] = useTrigger(false);
  const [showCommentError, triggerShowCommentError] = useTrigger(false);

  const [errorMessage, setErrorMessage] = useState(null);

  const formatDate = (date) => {
    if (!date) return "";
    const [month, day, year] = date.split("-");
    return `${year}-${month}-${day}`;
  };

  const fetchSWTD = () => {
    getSWTD(
      {
        token: token,
        form_id: id,
      },
      (response) => {
        const data = response.data;
        setSWTD(data);

        const formattedDate = formatDate(data.date);
        setForm({
          title: data.title,
          venue: data.venue,
          category: data.category,
          role: data.role,
          date: formattedDate,
          time_started: data.time_started,
          time_finished: data.time_finished,
          points: data.points,
          benefits: data.benefits,
        });
      },
      (error) => {
        console.log("Error fetching SWTD data: ", error);
      }
    );
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const isTimeInvalid = () => {
    const timeStart = form.time_started;
    const timeFinish = form.time_finished;
    if (timeStart > timeFinish) return true;
  };

  const invalidFields = () => {
    const requiredFields = [
      "title",
      "venue",
      "category",
      "role",
      "time_started",
      "time_finished",
      "benefits",
    ];
    return (
      requiredFields.some((field) => isEmpty(form[field])) ||
      isTimeInvalid() ||
      !isValidDate(form.date)
    );
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmpty(form.date)) {
      const [year, month, day] = form.date.split("-");
      form.date = `${month}-${day}-${year}`;
    }

    await editSWTD(
      {
        id: id,
        ...form,
        token: token,
      },
      (response) => {
        triggerShowSuccess(3000);
        cancelEditing();
        fetchSWTD();
      },
      (error) => {
        if (error.response && error.response.data) {
          setErrorMessage(<>{error.response.data.error}</>);
          triggerShowError(3000);
          cancelEditing();
        } else {
          setErrorMessage(<>An error occurred.</>);
          triggerShowError(3000);
        }
      }
    );
  };

  const handlePost = async (e) => {
    e.preventDefault();

    if (isEmpty(comment)) {
      setErrorMessage("Comment cannot be empty.");
      setComment("");
      triggerShowCommentError(3000);
      return;
    }

    postComment(
      {
        id: id,
        token: token,
        message: comment,
      },
      (response) => {
        fetchComments();
        setComment("");
      },
      (error) => {
        console.log("Error: ", error);
      }
    );
  };

  const fetchComments = () => {
    getComments(
      {
        id: id,
        token: token,
      },
      (response) => {
        setComments(response.data.comments);
      },
      (error) => {
        console.log("Error: ", error);
      }
    );
  };

  const editSuccess = async () => {
    await fetchComments();
  };

  const handleDelete = async () => {
    await deleteComment(
      {
        swtd_id: id,
        comment_id: selectedComment.id,
        token: token,
      },
      (response) => {
        fetchComments();
      },
      (error) => {
        console.log("Error: ", error);
      }
    );
  };

  useEffect(() => {
    fetchSWTD();
    fetchComments();
  }, []);

  return (
    <div className={styles.background}>
      <Container className="d-flex flex-column justify-content-start align-items-start">
        <Row className="w-100 mb-2">
          <Col>
            <h3 className={styles.label}>
              <i
                className={`${styles.triangle} fa-solid fa-caret-left fa-xl`}
                onClick={() => navigate("/swtd")}></i>{" "}
              Training Information
            </h3>
          </Col>
          <Col className="text-end">
            {isEditing ? (
              <BtnSecondary
                onClick={() => {
                  cancelEditing();
                  fetchSWTD();
                }}>
                Cancel Editing
              </BtnSecondary>
            ) : (
              <BtnSecondary onClick={enableEditing}>Edit</BtnSecondary>
            )}
          </Col>
        </Row>
        <Card className="mb-3 w-100">
          <Card.Header className={styles.cardHeader}>SWTD Details</Card.Header>
          <Card.Body className={`${styles.cardBody} p-4`}>
            {showError && (
              <div className="alert alert-danger mb-3" role="alert">
                {errorMessage}
              </div>
            )}
            {showSuccess && (
              <div className="alert alert-success mb-3" role="alert">
                Details changed!
              </div>
            )}
            {/* Title */}
            <Form noValidate>
              <Row>
                <Form.Group as={Row} className="mb-3" controlId="inputTitle">
                  <Form.Label className={styles.formLabel} column sm="1">
                    Title
                  </Form.Label>
                  {isEditing ? (
                    <Col sm="11">
                      <Form.Control
                        type="text"
                        className={styles.formBox}
                        name="title"
                        onChange={handleChange}
                        value={form.title}
                        isInvalid={isEmpty(form.title)}
                      />
                      <Form.Control.Feedback type="invalid">
                        Title of SWTD is required.
                      </Form.Control.Feedback>
                    </Col>
                  ) : (
                    <Col className="d-flex align-items-center">
                      {swtd?.title}
                    </Col>
                  )}
                </Form.Group>
              </Row>

              {/* Venue */}
              <Row>
                <Form.Group as={Row} className="mb-3" controlId="inputVenue">
                  <Form.Label className={styles.formLabel} column sm="1">
                    Venue
                  </Form.Label>
                  {isEditing ? (
                    <Col sm="11">
                      <Form.Control
                        type="text"
                        className={styles.formBox}
                        name="venue"
                        onChange={handleChange}
                        value={form.venue}
                        isInvalid={isEmpty(form.venue)}
                      />
                      <Form.Control.Feedback type="invalid">
                        Venue of SWTD is required.
                      </Form.Control.Feedback>
                    </Col>
                  ) : (
                    <Col className="d-flex align-items-center">
                      {swtd?.venue}
                    </Col>
                  )}
                </Form.Group>
              </Row>

              {/* Category */}
              <Row className="w-100">
                <Col>
                  <Form.Group
                    as={Row}
                    className="mb-3"
                    controlId="inputCategory">
                    <Form.Label className={styles.formLabel} column sm="2">
                      Category
                    </Form.Label>
                    {isEditing ? (
                      <Col sm="10">
                        <Form.Select
                          className={styles.formBox}
                          name="category"
                          onChange={handleChange}
                          value={form.category}
                          isInvalid={isEmpty(form.category)}>
                          <option value="" disabled>
                            Select a category
                          </option>
                          {categories.categories.map((category, index) => (
                            <option key={index} value={category}>
                              {category}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          Category of SWTD is required.
                        </Form.Control.Feedback>
                      </Col>
                    ) : (
                      <Col className="d-flex align-items-center">
                        {swtd?.category}
                      </Col>
                    )}
                  </Form.Group>
                </Col>

                {/* Role */}
                <Col>
                  <Form.Group as={Row} className="mb-3" controlId="inputRole">
                    <Form.Label
                      className={`${styles.formLabel} text-end`}
                      column
                      sm="2">
                      Role
                    </Form.Label>
                    {isEditing ? (
                      <Col sm="10">
                        <Form.Select
                          className={styles.formBox}
                          name="role"
                          onChange={handleChange}
                          value={form.role}
                          isInvalid={isEmpty(form.role)}>
                          <option value="" disabled>
                            Select a role
                          </option>
                          {roles.roles.map((role, index) => (
                            <option key={index} value={role}>
                              {role}
                            </option>
                          ))}
                        </Form.Select>

                        <Form.Control.Feedback type="invalid">
                          Role is required.
                        </Form.Control.Feedback>
                      </Col>
                    ) : (
                      <Col className="d-flex align-items-center">
                        {swtd?.role}
                      </Col>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              {/* Date */}
              <Row className="w-100">
                <Col>
                  <Form.Group as={Row} className="mb-3" controlId="inputDate">
                    <Form.Label className={styles.formLabel} column sm="2">
                      Date
                    </Form.Label>
                    {isEditing ? (
                      <Col sm="10">
                        <Form.Control
                          type="date"
                          max={new Date().toISOString().slice(0, 10)}
                          className={styles.formBox}
                          name="date"
                          onChange={handleChange}
                          value={form.date}
                          isInvalid={
                            (!isEmpty(form.date) && !isValidDate(form.date)) ||
                            isEmpty(form.date)
                          }
                        />
                        {isEmpty(form.date) && (
                          <Form.Control.Feedback type="invalid">
                            Date is required.
                          </Form.Control.Feedback>
                        )}

                        {!isEmpty(form.date) && !isValidDate(form.date) && (
                          <Form.Control.Feedback type="invalid">
                            Date must be valid.
                          </Form.Control.Feedback>
                        )}
                      </Col>
                    ) : (
                      <Col className="d-flex align-items-center">
                        {swtd?.date}
                      </Col>
                    )}
                  </Form.Group>
                </Col>

                {/* Proof */}
                <Col className="text-end">
                  <Form.Group as={Row} className="mb-3" controlId="inputProof">
                    <Form.Label className={styles.formLabel} column sm="2">
                      Proof
                    </Form.Label>
                    <Col className="text-start" sm="10">
                      <Form.Control
                        type="file"
                        className={styles.formBox}
                        name="proof"
                      />
                    </Col>
                  </Form.Group>
                </Col>
              </Row>

              {/* Time */}
              <Row className="w-100">
                <Col className={styles.time}>
                  <Form.Group
                    as={Row}
                    className="mb-3"
                    controlId="inputTimeStart">
                    <Form.Label className={styles.formLabel} column sm="2">
                      Time
                    </Form.Label>
                    {isEditing ? (
                      <>
                        <Col className="text-start" sm="4">
                          <FloatingLabel
                            controlId="floatingInputStart"
                            label="Time Start">
                            <Form.Control
                              type="time"
                              className={styles.formBox}
                              name="time_started"
                              onChange={handleChange}
                              value={form.time_started}
                              isInvalid={
                                isEmpty(form.time_started) ||
                                isEmpty(form.time_finished) ||
                                isTimeInvalid()
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {isEmpty(form.time_started) ? (
                                <>Time is required.</>
                              ) : (
                                <>Time must be valid.</>
                              )}
                            </Form.Control.Feedback>
                          </FloatingLabel>
                        </Col>
                        <Col
                          className="d-flex align-items-center justify-content-center text-center"
                          sm="1">
                          <span>to</span>
                        </Col>
                        <Col sm="4">
                          <FloatingLabel
                            controlId="floatingInputFinish"
                            label="Time End">
                            <Form.Control
                              type="time"
                              className={styles.formBox}
                              name="time_finished"
                              onChange={handleChange}
                              value={form.time_finished}
                              isInvalid={
                                isTimeInvalid(form.time_finished) ||
                                (!isEmpty(form.time_started) &&
                                  isEmpty(form.time_finished))
                              }
                            />
                          </FloatingLabel>
                        </Col>
                      </>
                    ) : (
                      <Col className="d-flex align-items-center" sm="10">
                        {swtd?.time_started} to {swtd?.time_finished}
                      </Col>
                    )}
                  </Form.Group>
                </Col>
                <Col className="text-end">
                  <Form.Group as={Row} className="mb-3" controlId="inputPoints">
                    <Form.Label className={styles.formLabel} column sm="2">
                      Points
                    </Form.Label>
                    <Col
                      className="d-flex justify-content-start align-items-center"
                      sm="2">
                      {swtd?.points}
                    </Col>
                  </Form.Group>
                </Col>
              </Row>

              {/* Benefits */}
              <Row>
                <Form.Group as={Row} className="mb-3" controlId="inputBenefits">
                  <Form.Label className={styles.formLabel} column sm="1">
                    Benefits
                  </Form.Label>
                  {isEditing ? (
                    <Col sm="11">
                      <Form.Control
                        as="textarea"
                        className={styles.formBox}
                        name="benefits"
                        onChange={handleChange}
                        value={form.benefits}
                        isInvalid={isEmpty(form.benefits)}
                      />
                      <Form.Control.Feedback type="invalid">
                        Benefits is required.
                      </Form.Control.Feedback>
                    </Col>
                  ) : (
                    <Col className="d-flex align-items-center">
                      {swtd?.benefits}
                    </Col>
                  )}
                </Form.Group>
              </Row>
              {isEditing && (
                <Row>
                  <Col className="text-end">
                    <BtnPrimary
                      onClick={handleSubmit}
                      disabled={invalidFields()}>
                      Save Changes
                    </BtnPrimary>
                  </Col>
                </Row>
              )}
            </Form>
          </Card.Body>
        </Card>

        {!isEditing && (
          <Card className="mb-3 w-100">
            <Card.Header className={styles.cardHeader}>Comments</Card.Header>
            {comments.length !== 0 ? (
              <Card.Body
                className={`${styles.cardBody} d-flex justify-content-center align-items center p-1`}>
                {showCommentError && (
                  <div className="alert alert-danger mb-3" role="alert">
                    {errorMessage}
                  </div>
                )}

                <Row className="w-100">
                  <ListGroup variant="flush">
                    {comments &&
                      comments.map((item) => (
                        <ListGroup.Item
                          key={item.id}
                          className={styles.commentBox}>
                          <Row>
                            <Col xs={2}>
                              {item.author.firstname} {item.author.lastname}
                            </Col>
                            <Col xs={6}>{item.message}</Col>
                            <Col xs={2}>{item.date_modified}</Col>
                            <Col className="text-end" xs={1}>
                              <i
                                className={`${styles.commentEdit} fa-solid fa-pen-to-square`}
                                onClick={() => {
                                  openCommentModal();
                                  setSelectedComment(item);
                                }}></i>
                            </Col>
                            <Col className="text-end" xs={1}>
                              <i
                                className={`${styles.commentDelete} fa-solid fa-trash-can`}
                                onClick={() => {
                                  openModal();
                                  setSelectedComment(item);
                                }}></i>
                            </Col>
                          </Row>
                          {item.is_edited && (
                            <Badge bg="secondary" pill>
                              Edited
                            </Badge>
                          )}
                        </ListGroup.Item>
                      ))}
                    <CommentModal
                      show={showCommentModal}
                      onHide={closeCommentModal}
                      data={selectedComment}
                      editSuccess={editSuccess}
                    />
                    <ConfirmationModal
                      show={showModal}
                      onHide={closeModal}
                      onConfirm={handleDelete}
                      header={"Delete Comment"}
                      message={"Do you wish to delete this comment?"}
                    />
                  </ListGroup>
                </Row>
              </Card.Body>
            ) : (
              <Card.Subtitle
                className={`${styles.comment} d-flex justify-content-center align-items center p-4 text-muted`}>
                No comments yet.
              </Card.Subtitle>
            )}

            <Card.Footer className="p-3">
              <Form noValidate onSubmit={(e) => e.preventDefault()}>
                <Row className="w-100">
                  <Col sm="11">
                    <Form.Group>
                      <Form.Control
                        type="text"
                        className={styles.formBox}
                        name="comment"
                        onChange={handleCommentChange}
                        value={comment}
                      />
                    </Form.Group>
                  </Col>
                  <Col className="text-end" sm="1">
                    <Button
                      className={`${styles.button} w-100`}
                      onClick={handlePost}>
                      <i className="fa-solid fa-paper-plane fa-lg"></i>
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Footer>
          </Card>
        )}
      </Container>
    </div>
  );
};

export default EditSWTD;
