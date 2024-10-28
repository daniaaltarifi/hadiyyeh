const db = require("../config.js");
const nodemailer = require("nodemailer");

const { sendEmail } = require('../EmailService.js');

const chargeBalance=async(req,res)=>{
    const { userId, amount, paymentMethod } = req.body;
    // Simulate payment processing here (you would integrate with a real payment API)
    if (amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount. Please enter a positive number.' });
      }
    // Log the payment attempt
    const paymentQuery = 'INSERT INTO payments (userId, amount, status, paymentMethod) VALUES (?, ?, ?, ?)';
    db.query(paymentQuery, [userId, amount, 'pending', paymentMethod], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error processing payment.' });
        }
        // Generate a unique transaction code
        res.status(200).json({ 
            message: 'Your payment is under review. Please wait for admin confirmation, and you will receive an email with your transaction code.' 
        });
        
    });
}
// Confirm Payment Function
// const confirmPayment = (req, res) => {
//     const { userId } = req.body;
//     if (!userId) {
//         return res.status(400).json({ message: 'User ID is required.' });
//     }
//     // Check for pending payments for the user
//     const checkPaymentQuery = `
//         SELECT p.amount, u.email 
//         FROM payments p 
//         JOIN login u ON p.userId = u.id 
//         WHERE p.userId = ? AND p.status = ?`;
    
//     db.query(checkPaymentQuery, [userId, 'pending'], (err, results) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ message: 'Database error.' });
//         }
//         if (results.length === 0) {
//             return res.status(400).json({ message: 'No pending payment found for this user.' });
//         }
//         const { amount, email } = results[0];
//         // Update payment status to completed
//         const updatePaymentQuery = 'UPDATE payments SET status = ? WHERE userId = ? AND amount = ? AND status = ?';
//         db.query(updatePaymentQuery, ['completed', userId, amount, 'pending'], (err) => {
//             if (err) {
//                 console.error('Error updating payment status:', err);
//                 return res.status(500).json({ message: 'Error updating payment status.' });
//             }
//             // Generate a unique transaction code
//             const transactionCode = generateTransactionCode();
//             // Insert transaction code
//             const codeQuery = 'INSERT INTO transaction_codes (code, amount) VALUES (?, ?)';
//             db.query(codeQuery, [transactionCode, amount], (err) => {
//                 if (err) {
//                     console.error('Error generating transaction code:', err);
//                     return res.status(500).json({ message: 'Error generating transaction code.' });
//                 }
//                 // Send email
//                 sendEmail(
//                     email,
//                     'Hadiyyeh Transaction Code',
//                     `Your transaction code is: ${transactionCode}`,
//                     `<p>Your transaction code is: <strong>${transactionCode}</strong></p>
//                      <p>To use it, please go to your account page and locate the "Wallet Code" section.</p>
//                      <p>Fill in the received code and click submit, then reload the page.</p>
//                      <p>We will then add the requested balance to your account.</p>`
//                   )
//                     .then(() => {
//                         res.status(200).json({ message: 'Payment confirmed. Transaction code sent to the user.' });
//                     })
//                     .catch((emailErr) => {
//                         console.error('Error sending email:', emailErr);
//                         res.status(500).json({ message: 'Payment confirmed, but there was an error sending the email.' });
//                     });
//             });
//         });
//     });
// };
const confirmPayment = (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    // Check for pending payments for the user
    const checkPaymentQuery = `
        SELECT p.amount, u.email 
        FROM payments p 
        JOIN login u ON p.userId = u.id 
        WHERE p.userId = ? AND p.status = ?`;
    
    db.query(checkPaymentQuery, [userId, 'pending'], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error.' });
        }
        if (results.length === 0) {
            return res.status(400).json({ message: 'No pending payment found for this user.' });
        }

        const { amount, email } = results[0];
        
        // Update payment status to completed
        const updatePaymentQuery = 'UPDATE payments SET status = ? WHERE userId = ? AND amount = ? AND status = ?';
        db.query(updatePaymentQuery, ['completed', userId, amount, 'pending'], (err) => {
            if (err) {
                console.error('Error updating payment status:', err);
                return res.status(500).json({ message: 'Error updating payment status.' });
            }

            // Get the updated payment details
            const getUpdatedPaymentQuery = 'SELECT * FROM payments WHERE userId = ? AND amount = ? AND status = ?';
            db.query(getUpdatedPaymentQuery, [userId, amount, 'completed'], (err, updatedResults) => {
                if (err) {
                    console.error('Error retrieving updated payment:', err);
                    return res.status(500).json({ message: 'Error retrieving updated payment.' });
                }
                const updatedPayment = updatedResults[0];

                // Generate a unique transaction code
                const transactionCode = generateTransactionCode();
                // Insert transaction code
                const codeQuery = 'INSERT INTO transaction_codes (code, amount) VALUES (?, ?)';
                db.query(codeQuery, [transactionCode, amount], (err) => {
                    if (err) {
                        console.error('Error generating transaction code:', err);
                        return res.status(500).json({ message: 'Error generating transaction code.' });
                    }

                    // Send email
                    sendEmail(
                        email,
                        'Hadiyyeh Transaction Code',
                        `Your transaction code is: ${transactionCode}`,
                        `<p>Your transaction code is: <strong>${transactionCode}</strong></p>
                         <p>To use it, please go to your account page and locate the "Wallet Code" section.</p>
                         <p>Fill in the received code and click submit, then reload the page.</p>
                         <p>We will then add the requested balance to your account.</p>`
                    )
                    .then(() => {
                        res.status(200).json({ 
                            message: 'Payment confirmed. Transaction code sent to the user.', 
                            updatedPayment // Include the updated payment details
                        });
                    })
                    .catch((emailErr) => {
                        console.error('Error sending email:', emailErr);
                        res.status(500).json({ message: 'Payment confirmed, but there was an error sending the email.' });
                    });
                });
            });
        });
    });
};


// Function to generate a unique transaction code
function generateTransactionCode() {
    return Math.random().toString(36).substr(2, 8); // Example code
}
const redemCode = (req, res) => {
    const { userId, code } = req.body;
    // Check if the code exists
    db.query('SELECT amount, isActive FROM transaction_codes WHERE code = ?', [code], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error.' });
        }
        if (results.length === 0) {
            return res.status(400).json({ message: 'Code does not exist.' });
        }
        const { amount, isActive } = results[0];
        if (!isActive) {
            return res.status(400).json({ message: 'Code is inactive.' });
        }
        // Proceed with balance update
        db.query('UPDATE login SET balance = balance + ? WHERE id = ?', [amount, userId], (err, updateResult) => {
            if (err) {
                console.error('Error updating balance:', err);
                return res.status(500).json({ message: 'Error updating balance.' });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(400).json({ message: 'No user found or balance not updated.' });
            }
            // Mark the code as used
            db.query('UPDATE transaction_codes SET isActive = FALSE WHERE code = ?', [code], (err) => {
                if (err) {
                    console.error('Error deactivating code:', err);
                    return res.status(500).json({ message: 'Error deactivating code.' });
                }

                res.status(200).json({ message: 'Balance added successfully.', newBalance: amount });
            });
        });
    });
};

const transferBalance=async(req,res)=>{
    const { fromUserId, toEmail, amount } = req.body;
    // Check if both users exist
    const checkUsersQuery = 'SELECT id, balance FROM login WHERE id = ? OR email = ?';
    db.query(checkUsersQuery, [fromUserId, toEmail], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error.' });
        }

        if (results.length < 2) {
            return res.status(400).json({ message: 'One or both users do not exist.' });
        }

        const fromUserBalance = results[0].balance;
        const toUserId = results[1].id;

        if (fromUserBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance.' });
        }

        // Deduct balance from the sender
        const deductQuery = 'UPDATE login SET balance = balance - ? WHERE id = ?';
        db.query(deductQuery, [amount, fromUserId], (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error deducting balance.' });
            }

            // Add balance to the recipient
            const addQuery = 'UPDATE login SET balance = balance + ? WHERE id = ?';
            db.query(addQuery, [amount, toUserId], (err) => {
                if (err) {
                    // If adding balance fails, revert the deduction manually
                    const revertDeductQuery = 'UPDATE login SET balance = balance + ? WHERE id = ?';
                    db.query(revertDeductQuery, [amount, fromUserId], (revertErr) => {
                        if (revertErr) {
                            console.error('Error reverting balance deduction:', revertErr);
                        }
                        return res.status(500).json({ message: 'Error adding balance to recipient.' });
                    });
                } else {
                    // Log the transfer
                    const transferQuery = 'INSERT INTO transfers (fromUserId, toUserId, amount) VALUES (?, ?, ?)';
                    db.query(transferQuery, [fromUserId, toUserId, amount], (err) => {
                        if (err) {
                            // If logging fails, revert the deduction
                            const revertDeductQuery = 'UPDATE login SET balance = balance + ? WHERE id = ?';
                            db.query(revertDeductQuery, [amount, fromUserId], (revertErr) => {
                                if (revertErr) {
                                    console.error('Error reverting balance deduction:', revertErr);
                                }
                                return res.status(500).json({ message: 'Error logging transfer.' });
                            });
                        } else {
                            res.status(200).json({ message: 'Transfer successful.' });
                        }
                    });
                }
            });
        });
    });
}
const decreseBalance= async(req,res)=>{
    const {userId, new_balance}=req.body;
    if (!userId || new_balance === undefined) {
        return res.status(400).json({ message: 'User ID and new balance are required.' });
      }
    
      // Update the user's balance in the database
      const query = 'UPDATE login SET balance = ? WHERE id = ?';
      db.query(query, [new_balance, userId], (error, results) => {
        if (error) {
          console.error('Error updating balance:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }
    
        if (results.affectedRows === 0) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        res.status(200).json({ message: 'Balance updated successfully', new_balance });
      });
}
const getPaymentTable = async (req, res) => {
    const query = `SELECT pa.id, pa.userId, pa.amount, pa.status, pa.paymentMethod, 
                          DATE_FORMAT(pa.created_at, '%y-%m-%d') AS created_at, 
                          us.first_name, us.last_name, us.email
                   FROM payments AS pa
                   LEFT JOIN login AS us ON us.id = pa.userId`;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error.' });
        }
        res.json(results);
    });
};
const deletePayment=async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Payment ID is required.' });
    }
    const query = 'DELETE FROM payments WHERE id =?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Payment not found.' });
        }
        res.status(200).json({ message: 'Payment deleted successfully.' });
    });
}

module.exports ={chargeBalance,redemCode,transferBalance,confirmPayment,decreseBalance,getPaymentTable,deletePayment}