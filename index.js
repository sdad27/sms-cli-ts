#! /usr/bin/env node
import inquirer from "inquirer";
const students = [];
const tuitionFees = {
    "MS.Office": 1000,
    "HTML & CSS": 2000,
    "Javascript": 3000,
    "Typescript": 4000,
    "NextJs": 5000,
    "Python": 6000,
};
async function mainMenu() {
    const { choice } = await inquirer.prompt([
        {
            type: "list",
            name: "choice",
            message: "Choose an action:",
            choices: ["Add Student", "Update Student", "Delete Student", "View Students", "Exit"]
        }
    ]);
    switch (choice) {
        case "Add Student":
            await addStudent();
            break;
        case "Update Student":
            await updateStudent();
            break;
        case "Delete Student":
            await deleteStudent();
            break;
        case "View Students":
            viewStudents();
            break;
        case "Exit":
            console.log("Exiting student management system.");
            process.exit();
            break;
    }
}
async function addStudent() {
    const studentDetails = await inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "Enter the student name:",
            validate: function (value) {
                return value.trim() !== "" ? true : "Please enter the student name";
            }
        }
    ]);
    const id = Math.floor(10000 + Math.random() * 90000);
    const courses = await selectCourses();
    const tuitionFeePaid = await promptPayment(studentDetails.name, courses);
    if (tuitionFeePaid >= 0) {
        const totalTuitionFee = courses.reduce((total, course) => total + tuitionFees[course], 0);
        const balance = tuitionFeePaid - totalTuitionFee;
        students.push({ name: studentDetails.name, id, courses, tuitionFeePaid, balance });
        console.log(`Student added successfully. The ID is ${id}.`);
    }
    else {
        console.log("Student could not be added due to incorrect payment amount.");
    }
}
async function selectCourses(existingCourses) {
    const courseChoices = Object.keys(tuitionFees).map(course => ({
        name: `${course} - Rs ${tuitionFees[course]}`,
        value: course
    }));
    const { courses } = await inquirer.prompt([
        {
            type: "checkbox",
            name: "courses",
            message: "Select courses:",
            choices: courseChoices
        }
    ]);
    return courses;
}
async function promptPayment(name, courses, remainingBalance = 0) {
    const totalTuitionFee = courses.reduce((total, course) => total + tuitionFees[course], 0);
    const requiredPayment = Math.max(totalTuitionFee - remainingBalance, 0);
    const { paymentType, amount } = await inquirer.prompt([
        {
            type: "list",
            name: "paymentType",
            message: "Select the payment method:",
            choices: ["Bank Transfer", "Jazzcash", "Easypaisa"]
        },
        {
            type: "input",
            name: "amount",
            message: `Enter the amount for ${name}'s courses (${courses.join(", ")}):`,
            validate: function (value) {
                return value.trim() !== "" ? true : "Please enter the amount";
            }
        }
    ]);
    const paymentAmount = parseFloat(amount);
    if (paymentAmount >= requiredPayment) {
        console.log(`Congratulations, ${name} has enrolled in ${courses.join(", ")}.`);
        return paymentAmount;
    }
    else {
        console.log(`Insufficient payment. Required amount: ${requiredPayment}`);
        return -1;
    }
}
async function updateStudent() {
    const { id } = await inquirer.prompt([
        {
            type: "input",
            name: "id",
            message: "Enter the ID of the student you want to update:",
            validate: function (value) {
                return value.trim() !== "" ? true : "Please enter the student ID";
            }
        }
    ]);
    const studentIndex = students.findIndex(student => student.id.toString() === id);
    if (studentIndex !== -1) {
        const student = students[studentIndex];
        console.log(`Current details for ${student.name}:`);
        console.log(student);
        const options = [
            { name: "Add new courses", value: "add" },
            { name: "Replace an existing course", value: "replace" }
        ];
        const { choice } = await inquirer.prompt([
            {
                type: "list",
                name: "choice",
                message: "Choose an option:",
                choices: options
            }
        ]);
        if (choice === "add") {
            const newCourses = await selectCourses();
            const totalNewCoursesFee = newCourses.reduce((total, course) => total + tuitionFees[course], 0);
            const balanceBeforePayment = student.balance;
            const additionalFeeNeeded = totalNewCoursesFee - balanceBeforePayment;
            if (additionalFeeNeeded <= 0) {
                student.balance -= totalNewCoursesFee;
                student.courses.push(...newCourses);
                console.log(`Courses added successfully. Remaining balance: ${student.balance}`);
            }
            else {
                console.log(`Additional fee needed: ${additionalFeeNeeded}`);
                student.balance = 0;
                const paymentAmount = await promptPayment(student.name, newCourses, balanceBeforePayment);
                if (paymentAmount >= additionalFeeNeeded) {
                    student.courses.push(...newCourses);
                    student.balance += paymentAmount - additionalFeeNeeded;
                    console.log(`Courses added successfully. Remaining balance: ${student.balance}`);
                }
                else {
                    console.log("Insufficient payment. Course update failed.");
                }
            }
        }
        else if (choice === "replace") {
            const { courseToReplace } = await inquirer.prompt([
                {
                    type: "list",
                    name: "courseToReplace",
                    message: "Which course do you want to replace?",
                    choices: student.courses
                }
            ]);
            const newCourse = await selectCourses();
            const oldCourseFee = tuitionFees[courseToReplace];
            const newCourseFee = tuitionFees[newCourse[0]];
            const difference = newCourseFee - oldCourseFee;
            console.log(`The difference in tuition fees is: ${difference}`);
            const remainingBalance = student.balance;
            const additionalFeeNeeded = difference - remainingBalance;
            if (additionalFeeNeeded <= 0) {
                student.balance -= difference;
                const index = student.courses.indexOf(courseToReplace);
                if (index !== -1) {
                    student.courses[index] = newCourse[0];
                    console.log(`Course replaced successfully. Remaining balance: ${student.balance}`);
                }
            }
            else {
                console.log(`Additional fee needed: ${additionalFeeNeeded}`);
                student.balance = 0;
                const paymentAmount = await promptPayment(student.name, newCourse, remainingBalance);
                if (paymentAmount >= additionalFeeNeeded) {
                    const index = student.courses.indexOf(courseToReplace);
                    if (index !== -1) {
                        student.courses[index] = newCourse[0];
                        student.balance += paymentAmount - additionalFeeNeeded;
                        console.log(`Course replaced successfully. Remaining balance: ${student.balance}`);
                    }
                }
                else {
                    console.log("Insufficient payment. Course update failed.");
                }
            }
        }
    }
    else {
        console.log(`Student with ID ${id} not found.`);
    }
}
async function deleteStudent() {
    const { id } = await inquirer.prompt([
        {
            type: "input",
            name: "id",
            message: "Enter the ID of the student you want to delete:",
            validate: function (value) {
                return value.trim() !== "" ? true : "Please enter the student ID";
            }
        }
    ]);
    const index = students.findIndex(student => student.id.toString() === id);
    if (index !== -1) {
        const deletedStudent = students.splice(index, 1)[0];
        console.log(`Student ${deletedStudent.name} with ID ${id} deleted successfully.`);
    }
    else {
        console.log(`Student with ID ${id} not found.`);
    }
}
function viewStudents() {
    console.log("\n******** Student List ********\n");
    students.forEach(student => {
        console.log(`Student Name: ${student.name}`);
        console.log(`Student ID: ${student.id}`);
        console.log(`Courses: ${student.courses.join(", ")}`);
        console.log(`Tuition Fee Paid: ${student.tuitionFeePaid}`);
        console.log(`Balance: ${student.balance}`);
        console.log("------------------------------");
    });
}
async function start() {
    console.log("Welcome to Student Management System.\n");
    while (true) {
        await mainMenu();
    }
}
start();
