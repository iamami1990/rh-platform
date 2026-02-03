/**
 * Centralized Models Export
 * Olympia HR Platform - Data Validation Layer
 */

const Employee = require('./Employee');
const Attendance = require('./Attendance');
const Payroll = require('./Payroll');
const Leave = require('./Leave');
const Overtime = require('./Overtime');

module.exports = {
    // Employee
    EmployeeSchema: Employee.EmployeeSchema,
    validateEmployee: Employee.validateEmployee,
    validateEmployeeUpdate: Employee.validateEmployeeUpdate,

    // Attendance
    AttendanceSchema: Attendance.AttendanceSchema,
    CheckInSchema: Attendance.CheckInSchema,
    CheckOutSchema: Attendance.CheckOutSchema,
    validateAttendance: Attendance.validateAttendance,
    validateCheckIn: Attendance.validateCheckIn,
    validateCheckOut: Attendance.validateCheckOut,

    // Payroll
    PayrollSchema: Payroll.PayrollSchema,
    GeneratePayrollSchema: Payroll.GeneratePayrollSchema,
    validatePayroll: Payroll.validatePayroll,
    validateGeneratePayroll: Payroll.validateGeneratePayroll,

    // Leave
    LeaveSchema: Leave.LeaveSchema,
    LeaveBalanceSchema: Leave.LeaveBalanceSchema,
    CreateLeaveSchema: Leave.CreateLeaveSchema,
    validateLeave: Leave.validateLeave,
    validateLeaveBalance: Leave.validateLeaveBalance,
    validateCreateLeave: Leave.validateCreateLeave,

    // Overtime
    OvertimeSchema: Overtime.OvertimeSchema,
    CreateOvertimeSchema: Overtime.CreateOvertimeSchema,
    ApproveOvertimeSchema: Overtime.ApproveOvertimeSchema,
    RejectOvertimeSchema: Overtime.RejectOvertimeSchema,
    validateOvertime: Overtime.validateOvertime,
    validateCreateOvertime: Overtime.validateCreateOvertime,
    validateApproveOvertime: Overtime.validateApproveOvertime,
    validateRejectOvertime: Overtime.validateRejectOvertime
};
