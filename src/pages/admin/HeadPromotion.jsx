import React, { useState, useEffect } from "react";
import { Row, Col, Form, InputGroup, Table, Spinner, OverlayTrigger, Tooltip, Badge } from "react-bootstrap"; /* prettier-ignore */
import Cookies from "js-cookie";

import { getAllUsers, addHead, removeHead } from "../../api/admin";

import PaginationComponent from "../../components/Paging";
import styles from "./style.module.css";
import BtnPrimary from "../../common/buttons/BtnPrimary";
import BtnSecondary from "../../common/buttons/BtnSecondary";

const HeadPromotion = () => {
  const userID = Cookies.get("userID");
  const token = Cookies.get("userToken");
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [disable, setDisable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  const fetchAllUsers = async () => {
    await getAllUsers(
      {
        token: token,
      },
      (response) => {
        const filter = response.users?.filter(
          (user) => user.id !== parseInt(userID, 10)
        );
        setEmployees(filter);
        setLoading(false);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  const grantHead = async (id, val) => {
    setDisable(true);
    await addHead(
      {
        id: id,
        head_id: val,
        token: token,
      },
      (response) => {
        fetchAllUsers();
        setDisable(false);
        setLoading(false);
      },
      (error) => {
        setDisable(false);
        console.log(error);
      }
    );
  };

  const revokeHead = async (id) => {
    setDisable(true);
    await removeHead(
      {
        id: id,
        token: token,
      },
      (response) => {
        fetchAllUsers();
        setDisable(false);
        setLoading(false);
      },
      (error) => {
        setDisable(false);
        console.log(error);
      }
    );
  };

  const handleSearchFilter = (employeeList, query) => {
    return employeeList.filter((employee) => {
      const match =
        employee.employee_id?.includes(query) ||
        employee.firstname.toLowerCase().includes(query.toLowerCase()) ||
        employee.lastname.toLowerCase().includes(query.toLowerCase());
      return match;
    });
  };

  const privilegedUsers = employees.filter(e => e.is_head === true).sort((a, b) => a.lastname.localeCompare(b.lastname));

  // For pagination
  const filteredEmployees = searchQuery
    ? handleSearchFilter(employees, searchQuery)
    : privilegedUsers;
  const totalRecords = filteredEmployees?.length;
  const totalPages = totalRecords
    ? Math.ceil(totalRecords / recordsPerPage)
    : 0;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredEmployees?.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);
  return (
    <>
      <Row className={`${styles.table} w-100`}>
        <span className="text-muted mb-3">
          Department Heads/Chairs can access the dashboard to validate SWTD
          submissions and grant clearance to employees in their department.{" "}
          <strong>Employee must be in a department.</strong>
        </span>
      </Row>
      <Row>
        <Col className="mb-1">
          <InputGroup className={`${styles.searchBar} mb-3`}>
            <InputGroup.Text>
              <i className="fa-solid fa-magnifying-glass"></i>
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Search by ID number, firstname, or lastname"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>
      <Row>
        {loading ? (
          <Row
            className={`${styles.loading} d-flex justify-content-center align-items-center w-100 mb-5`}>
            <Spinner className={`me-2`} animation="border" />
            Loading department heads...
          </Row>
        ) : (
          <>
            <Table
              className={styles.table}
              striped
              bordered
              hover
              responsive>
              <thead>
                <tr>
                  <th className="col-1">ID No.</th>
                  <th className="col-2">Name</th>
                  <th className="col-2">Department</th>
                  <th className="col-1 text-center">Role</th>
                  <th className="col-1 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length === 0 ?
                    <tr>
                      <td colSpan={5}>
                        <span className="d-flex justify-content-center">No employees to show. Start by searching for employees in the search bar.</span>
                      </td>
                    </tr>
                  :
                  currentRecords?.sort((a, b) => b.is_head - a.is_head)
                  ?.map((item) => (
                    <tr key={item.id}>
                      <td
                        className={`${
                          item.employee_id ? "" : "text-danger"
                        }`}>
                        {item.employee_id ? item.employee_id : "No ID"}
                      </td>
                      <td>
                        {item.lastname}, {item.firstname}
                      </td>
                      <td className={item.department ? "" : "text-danger"}>
                        {item.department
                          ? item.department.name
                          : "No department set."}
                      </td>
                      <td className="text-center">
                        {item.is_head ? (
                          <Badge bg="success">Head/Chair</Badge>
                        ) : (
                          <Badge bg="secondary">Employee</Badge>
                        )}
                      </td>
                      <td className="text-center">
                        {item.department ? (
                          <>
                            {item.is_head ? (
                              <BtnSecondary
                                disabled={disable}
                                onClick={() =>
                                  revokeHead(item.department.id)
                                }>
                                <i
                                  className={`fa-solid fa-circle-arrow-down fa-lg me-2`}></i>
                                DEMOTE
                              </BtnSecondary>
                            ) : (
                              <BtnPrimary
                                disabled={disable}
                                onClick={() =>
                                  grantHead(item.department.id, item.id)
                                }>
                                <i
                                  className={`fa-solid fa-circle-arrow-up fa-lg me-2`}></i>
                                PROMOTE
                              </BtnPrimary>
                            )}
                          </>
                        ) : (
                          <div className={styles.icon}>
                            <OverlayTrigger
                              placement="right"
                              overlay={
                                <Tooltip
                                  id="button-tooltip-1"
                                  className={styles.table}>
                                  Department is required.
                                </Tooltip>
                              }>
                              <i
                                className={`fa-solid fa-ban fa-xl text-danger me-2`}></i>
                            </OverlayTrigger>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
            <Row className="w-100 mb-3">
              <Col className="d-flex justify-content-center">
                <PaginationComponent
                  totalPages={totalPages}
                  currentPage={currentPage}
                  handlePageChange={handlePageChange}
                />
              </Col>
            </Row>
          </>
        )}
      </Row>
    </>
  );
};

export default HeadPromotion;
