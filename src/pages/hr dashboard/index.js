import React, { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Row, Col, Container, InputGroup, Form, ListGroup, Spinner, Pagination } from "react-bootstrap"; /* prettier-ignore */

import { getAllUsers, getTerms, getAllDepartments, getDepartment } from "../../api/admin"; /* prettier-ignore */
import { getClearanceStatus } from "../../api/user";
import { exportPointsOverview } from "../../api/export";
import SessionUserContext from "../../contexts/SessionUserContext";

import BtnPrimary from "../../common/buttons/BtnPrimary";
import BtnSecondary from "../../common/buttons/BtnSecondary";
import styles from "./style.module.css";

const HRDashboard = () => {
  const token = Cookies.get("userToken");
  const { user } = useContext(SessionUserContext);
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [terms, setTerms] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [departmentTerms, setDepartmentTerms] = useState([]);
  const [departmentTypes, setDepartmentTypes] = useState({
    semester: false,
    midyear: false,
    academic: false,
  });
  const [selectedTerm, setSelectedTerm] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [userClearanceStatus, setUserClearanceStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  const fetchAllUsers = async () => {
    await getAllUsers(
      {
        token: token,
      },
      (response) => {
        const employees = response.data?.filter(
          (us) => us.id !== user.id && !us.is_superuser
        );
        setDepartmentUsers(employees);
        setLoading(false);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  const fetchDepartment = async (id) => {
    getDepartment(
      {
        department_id: id,
        token: token,
      },
      (response) => {
        setSelectedDepartment(response.data);
      },
      (error) => {
        console.log(error.message);
      }
    );
  };

  const fetchDepartments = async () => {
    getAllDepartments(
      {
        token: token,
      },
      (response) => {
        setDepartments(response.departments);
        const uniqueLevels = [
          ...new Set(response.departments.map((dept) => dept.level)),
        ];
        setLevels(uniqueLevels);
        setLoading(false);
      },
      (error) => {
        console.log(error.message);
      }
    );
  };

  const fetchTerms = () => {
    getTerms(
      {
        token: token,
      },
      (response) => {
        setTerms(response.terms);
      },
      (error) => {
        console.log(error.message);
      }
    );
  };

  const fetchClearanceStatus = (employee, term) => {
    const termStatus = employee?.clearances.find(
      (clearance) => clearance.term.id === term
    );

    let isCleared = false;
    if (termStatus) isCleared = termStatus?.is_deleted ? false : true;
    else isCleared = false;

    getClearanceStatus(
      {
        id: employee.id,
        term_id: term,
        token: token,
      },
      (clearanceResponse) => {
        setUserClearanceStatus((prevStatus) => ({
          ...prevStatus,
          [employee.id]: {
            ...clearanceResponse,
            id: employee.id,
            employee_id: employee.employee_id,
            firstname: employee.firstname,
            lastname: employee.lastname,
            is_cleared: isCleared,
            department: employee.department,
          },
        }));
      },
      (error) => {
        console.log(
          `Clearance status error for user ${employee.id}:`,
          error.message
        );
      }
    );
  };

  const fetchClearanceStatusForAllUsers = (term) => {
    departmentUsers.forEach((us) => {
      fetchClearanceStatus(us, term);
    });
  };

  const handleEmployeeSWTDClick = (id) => {
    navigate(`/dashboard/${id}`);
  };

  const handleLevelChange = (e) => {
    const lev = e.target.value;
    setSelectedLevel(lev);
    setSelectedDepartment(null);
    setSelectedTerm(0);
  };

  const handlePrint = () => {
    exportPointsOverview(
      {
        id: selectedDepartment.id,
        term_id: selectedTerm,
        token: token,
      },
      (response) => {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const blobURL = URL.createObjectURL(blob);
        window.open(blobURL, "_blank");
      },
      (error) => {
        console.log(error);
      }
    );
  };

  const filteredDepartments = selectedLevel
    ? departments.filter((dept) => dept.level === selectedLevel)
    : departments;

  //Pagination
  const handleFilter = (employeeList, query, dept) => {
    return Object.values(employeeList).filter((employee) => {
      const matchesQuery =
        employee.employee_id?.includes(query) ||
        employee.firstname.toLowerCase().includes(query.toLowerCase()) ||
        employee.lastname.toLowerCase().includes(query.toLowerCase());

      const matchesDept = dept ? employee.department?.id === dept.id : true;

      return matchesQuery && matchesDept;
    });
  };

  const filteredEmployees = handleFilter(
    userClearanceStatus,
    searchQuery,
    selectedDepartment
  );

  const totalRecords = filteredEmployees.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  // Ensure currentPage does not exceed totalPages
  const currentPageClamped = Math.min(currentPage, totalPages);

  const indexOfLastRecord = currentPageClamped * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;

  const currentRecords = filteredEmployees.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    if (!user) setLoading(true);
    else {
      if (user?.is_admin) navigate("/dashboard");
      else if (!user?.is_staff && !user?.is_superuser) navigate("/swtd");
      else {
        setLoading(true);
        const fetchData = async () => {
          fetchDepartments();
          fetchTerms();
          await fetchAllUsers();
        };
        fetchData();
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (selectedDepartment) {
      setDepartmentTypes({
        ...departmentTypes,
        semester: selectedDepartment?.use_schoolyear === false ? true : false,
        midyear: selectedDepartment?.midyear_points > 0 ? true : false,
        academic: selectedDepartment?.use_schoolyear,
      });
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDepartment) {
      let filteredTerms = terms;

      const validTypes = [
        ...(departmentTypes.semester ? ["SEMESTER"] : []),
        ...(departmentTypes.midyear ? ["MIDYEAR/SUMMER"] : []),
        ...(departmentTypes.academic ? ["ACADEMIC YEAR"] : []),
      ];

      if (validTypes.length > 0) {
        filteredTerms = filteredTerms.filter((term) =>
          validTypes.includes(term.type)
        );
      }

      const ongoingTerm = filteredTerms.find(
        (term) => term.is_ongoing === true
      );
      setSelectedTerm(ongoingTerm?.id);
      setDepartmentTerms(filteredTerms);
    }
  }, [departmentTypes, terms, selectedDepartment]);

  useEffect(() => {
    if (selectedTerm) {
      fetchClearanceStatusForAllUsers(selectedTerm);
    }
  }, [selectedTerm]);

  if (loading)
    return (
      <Row
        className={`${styles.msg} d-flex flex-column justify-content-center align-items-center w-100`}
        style={{ height: "100vh" }}>
        <Col></Col>
        <Col className="text-center">
          <div>
            <Spinner animation="border" />
          </div>
          Loading data...
        </Col>
        <Col></Col>
      </Row>
    );

  return (
    <Container className="d-flex flex-column justify-content-start align-items-start">
      <Row className="w-100">
        <Col>
          <h3 className={styles.pageTitle}>Points Overview</h3>
        </Col>
      </Row>

      <Row className="w-100 mb-3">
        <Col md="6">
          <span className={`${styles.deptDropdown} text-muted`}>
            Select a department below to see the records of employees.
          </span>
        </Col>

        <Col className="text-end">
          <BtnPrimary
            onClick={() => {
              setSearchQuery("");
              setSelectedLevel("");
              setSelectedDepartment(null);
              setSelectedTerm(0);
            }}>
            <i className="fa-solid fa-trash-can me-2"></i>Reset
          </BtnPrimary>{" "}
          <BtnSecondary
            onClick={handlePrint}
            disabled={
              !selectedDepartment ||
              !selectedDepartment?.members ||
              !selectedDepartment?.head ||
              selectedTerm === 0
            }>
            <i className="fa-solid fa-file-arrow-down fa-lg me-2"></i> Export
          </BtnSecondary>
        </Col>
      </Row>

      <Row className="w-100">
        <Col>
          <InputGroup>
            <InputGroup.Text>
              <i className="fa-solid fa-landmark fa-lg"></i>
            </InputGroup.Text>
            <Form.Select
              name="selected_level"
              className={styles.deptDropdown}
              onChange={handleLevelChange}
              value={selectedLevel || ""}>
              <option value="" disabled>
                Select Level
              </option>
              {levels
                .sort((a, b) => a.localeCompare(b))
                .map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
            </Form.Select>
          </InputGroup>
        </Col>

        {/* DEPARTMENTS */}
        <Col>
          <InputGroup className={`${styles.searchBar} mb-3`}>
            <InputGroup.Text>
              <i className="fa-solid fa-book fa-lg"></i>
            </InputGroup.Text>
            <Form.Select
              value={selectedDepartment?.id || ""}
              className={styles.deptDropdown}
              disabled={!selectedLevel}
              onChange={(e) => fetchDepartment(e.target.value)}>
              <option value="" disabled>
                Select Department
              </option>
              {filteredDepartments
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
            </Form.Select>
          </InputGroup>
        </Col>

        {/* TERMS */}
        <Col>
          <InputGroup className={`${styles.searchBar} mb-3`}>
            <InputGroup.Text>
              <i className="fa-regular fa-calendar fa-lg"></i>
            </InputGroup.Text>
            <Form.Select
              value={selectedTerm}
              className={styles.deptDropdown}
              onChange={(e) => {
                setSelectedTerm(e.target.value.id);
              }}
              disabled={!selectedDepartment}>
              <option value="0" disabled>
                Select Term
              </option>
              {departmentTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </Form.Select>
          </InputGroup>
        </Col>
      </Row>

      {!selectedDepartment && !selectedTerm && (
        <hr className="w-100" style={{ opacity: "1" }} />
      )}

      {selectedDepartment && selectedTerm !== 0 && (
        <>
          <Row className="w-100 mb-3">
            <Col className="text-start" lg={6}>
              <InputGroup className={`${styles.searchBar}`}>
                <InputGroup.Text>
                  <i className="fa-solid fa-magnifying-glass"></i>
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  name="searchQuery"
                  placeholder="Search by ID number, firstname, or lastname."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </Col>
            {/* Temporarily removed for demo */}
            {/* <Col
              className={`${styles.semibold} d-flex align-items-center`}
              lg="auto">
              <i className="fa-solid fa-users fa-lg me-2"></i>Total Employees:{" "}
              {console.log(userClearanceStatus)}
              {Object.keys(userClearanceStatus)?.length}
            </Col>
            <Col
              className={`${styles.semibold} d-flex align-items-center`}
              lg="auto">
              <i className="fa-solid fa-user-check fa-lg text-success me-2"></i>
              Cleared Employees:{" "}
              {
                Object.keys(userClearanceStatus)?.filter(
                  (item) => item.is_cleared === true
                ).length
              }
            </Col>
            <Col
              className={`${styles.semibold} d-flex align-items-center`}
              lg="auto">
              <i className="fa-solid fa-user-xmark fa-lg text-danger me-2"></i>
              Non-cleared Employees:{" "}
              {
                Object.keys(userClearanceStatus)?.filter(
                  (item) => item.is_cleared === false
                ).length
              }
            </Col> */}
          </Row>
          {/* <Row className="w-100">
            <hr style={{ opacity: 1 }} />
          </Row> */}
          <Row className="w-100">
            {currentRecords.length === 0 ? (
              <span
                className={`${styles.msg} d-flex justify-content-center align-items-center mt-3 mb-3 w-100`}>
                No employees found.
              </span>
            ) : (
              <div className="mb-3">
                <ListGroup className="w-100" variant="flush">
                  <ListGroup.Item className={styles.tableHeader}>
                    <Row>
                      <Col md={2}>ID No.</Col>
                      <Col md={7}>Name</Col>
                      <Col md={1}>Points</Col>
                      <Col>Status</Col>
                    </Row>
                  </ListGroup.Item>
                </ListGroup>
                <ListGroup>
                  {currentRecords.map((item) => (
                    <ListGroup.Item
                      key={item.employee_id}
                      className={styles.tableBody}
                      onClick={() => handleEmployeeSWTDClick(item.id)}>
                      <Row>
                        <Col md={2}>{item.employee_id}</Col>
                        <Col md={7}>
                          {item.firstname} {item.lastname}
                        </Col>
                        <Col md={1}>{item.valid_points}</Col>
                        <Col
                          className={`text-${
                            item.is_cleared ? "success" : "danger"
                          } ${styles.userStatus}`}>
                          {item.is_cleared ? "CLEARED" : "NOT CLEARED"}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
          </Row>

          {/* PAGINATION */}
          {currentRecords.length !== 0 && (
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
          )}
        </>
      )}
    </Container>
  );
};

export default HRDashboard;
