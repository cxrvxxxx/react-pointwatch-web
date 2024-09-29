import React, { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Row, Col, Container, Form, InputGroup, ListGroup, Spinner, Pagination, Dropdown, DropdownButton } from "react-bootstrap"; /* prettier-ignore */

import departmentTypes from "../../data/departmentTypes.json";
import status from "../../data/status.json";
import { getAllSWTDs } from "../../api/swtd";
import { getTerms } from "../../api/admin";
import SessionUserContext from "../../contexts/SessionUserContext";
import styles from "./style.module.css";

const SWTDDashboard = () => {
  const id = Cookies.get("userID");
  const token = Cookies.get("userToken");
  const { user } = useContext(SessionUserContext);
  const navigate = useNavigate();

  const [userSWTDs, setUserSWTDs] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  const fetchAllSWTDs = async () => {
    await getAllSWTDs(
      {
        author_id: id,
        token: token,
      },
      (response) => {
        setUserSWTDs(response.swtds);
        setLoading(false);
      },
      (error) => {
        if (error.response && error.response.data) {
          console.log(error.response.data.error);
        }
      }
    );
  };

  const fetchTerms = () => {
    const allowedTerm = departmentTypes[user?.department];
    getTerms(
      {
        token: token,
      },
      (response) => {
        const filteredTerms = response.terms.filter((term) =>
          allowedTerm.includes(term.type)
        );
        setTerms(filteredTerms);
      },
      (error) => {
        console.log(error.message);
      }
    );
  };

  const truncateTitle = (title) => {
    if (title.length > 50) {
      return title.substring(0, 50) + "...";
    }
    return title;
  };

  const handleViewSWTD = (id) => {
    navigate(`/swtd/all/${id}`);
  };

  const handleSearchFilter = (swtdList, query) => {
    return swtdList.filter((swtd) => {
      const titleMatch = swtd.title.toLowerCase().includes(query.toLowerCase());
      return titleMatch;
    });
  };

  const handleStatusFilter = (swtdList, stat) => {
    return swtdList.filter((swtd) => {
      const statusMatch = swtd.validation.status === stat;
      return statusMatch;
    });
  };

  useEffect(() => {
    if (user) {
      fetchTerms();
      fetchAllSWTDs();
    } else {
      setLoading(true);
    }
  }, [user]);

  if (loading)
    return (
      <Row
        className={`${styles.loading} d-flex justify-content-center align-items-center w-100`}>
        <Spinner className={`me-2`} animation="border" />
        Loading data...
      </Row>
    );

  // SWTDs with selected term
  const termSWTDs = userSWTDs?.filter(
    (swtd) => swtd?.term.id === selectedTerm?.id
  );

  //If term is selected, use termSWTDs. Else, use default SWTDs.
  const swtds = selectedTerm ? termSWTDs : userSWTDs;

  //Filtered SWTDs with search bar
  const filteredSWTDs = searchQuery
    ? handleSearchFilter(swtds, searchQuery)
    : selectedStatus
    ? handleStatusFilter(swtds, selectedStatus)
    : swtds;

  // Calculate pagination
  const totalRecords = filteredSWTDs.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredSWTDs.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <Container className="d-flex flex-column justify-content-start align-items-start">
      <Row className="w-100 mb-2">
        <Col className="p-0">
          <h3 className={styles.label}>
            <i
              className={`${styles.triangle} fa-solid fa-caret-left fa-xl`}
              onClick={() => navigate("/swtd")}></i>{" "}
            SWTD Submissions
          </h3>
        </Col>
        <Col
          className={`d-flex align-items-center ${styles.employeeDetails}`}
          xs="auto">
          <i className="fa-regular fa-calendar me-2"></i> Term:{" "}
          {terms.length === 0 ? (
            <>No terms were added yet.</>
          ) : (
            <DropdownButton
              className={`${styles.defaultItem} ms-2`}
              variant={
                selectedTerm?.is_ongoing === true ? "success" : "secondary"
              }
              size="sm"
              title={selectedTerm ? selectedTerm.name : "All terms"}>
              <Dropdown.Item onClick={() => setSelectedTerm(null)}>
                All terms
              </Dropdown.Item>
              {terms &&
                terms.map((term) => (
                  <Dropdown.Item
                    key={term.id}
                    onClick={() => {
                      setSelectedTerm(term);
                    }}>
                    {term.name}
                  </Dropdown.Item>
                ))}
            </DropdownButton>
          )}
        </Col>
      </Row>

      <Row className="w-100">
        <Col className="text-start p-0" md={6}>
          <InputGroup className={`${styles.searchBar} mb-3`}>
            <InputGroup.Text>
              <i className="fa-solid fa-magnifying-glass"></i>
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col
          className={`${styles.cardBody} d-flex justify-content-end align-items-center mb-3`}>
          <span className="me-2">Status</span>
          <Col md="auto">
            <Form.Select
              name="filter"
              onChange={(e) => {
                setSelectedStatus(e.target.value);
              }}>
              <option value="">Select Status</option>
              {status.status.map((status, index) => (
                <option key={index} value={status}>
                  {status === "REJECTED" ? "FOR REVISION" : status}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Col>
      </Row>

      {currentRecords.length !== 0 ? (
        <>
          <Row className="w-100 mb-3">
            <ListGroup className="w-100" variant="flush">
              <ListGroup.Item className={styles.swtdHeader}>
                <Row>
                  <Col md={9}>Title</Col>
                  <Col md={2}>Status</Col>
                  <Col md={1}>Points</Col>
                </Row>
              </ListGroup.Item>
            </ListGroup>
            <ListGroup>
              {currentRecords.reverse().map((item) => (
                <ListGroup.Item
                  key={item.id}
                  className={styles.tableBody}
                  onClick={() => handleViewSWTD(item.id)}>
                  <Row>
                    <Col md={9}>{truncateTitle(item.title)}</Col>
                    <Col md={2}>{item.validation.status}</Col>
                    <Col md={1}>{item.points}</Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Row>
          <Row className="w-100 mb-3">
            <Col className="d-flex justify-content-center">
              <Pagination>
                <Pagination.First
                  className={styles.pageNum}
                  onClick={() => handlePageChange(1)}
                />
                <Pagination.Prev
                  className={styles.pageNum}
                  onClick={() => {
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                />
                {Array.from({ length: totalPages }, (_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    className={styles.pageNum}
                    onClick={() => handlePageChange(index + 1)}>
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  className={styles.pageNum}
                  onClick={() => {
                    if (currentPage < totalPages)
                      handlePageChange(currentPage + 1);
                  }}
                />
                <Pagination.Last
                  className={styles.pageNum}
                  onClick={() => handlePageChange(totalPages)}
                />
              </Pagination>
            </Col>
          </Row>
        </>
      ) : (
        <>
          <Row className="w-100">
            <hr />
          </Row>
          <Row className="w-100">
            <Col className={`${styles.employeeDetails} text-center`}>
              No submissions found.
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default SWTDDashboard;