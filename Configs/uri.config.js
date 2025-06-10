// Since URI for POST,GET,DELETE can change
// Hence URI can change , hence it is a configurable value and placed in Configs Folder 
module.exports = {
    USER_SIGNUP_URI: "/ecomm/api/v1/auth/signup",
    USER_SIGNIN_URI: "/ecomm/api/v1/auth/signin",
    BLOCK_USER_URI: "/ecomm/api/v1/auth/block",
    UNBLOCK_USER_URI: "/ecomm/api/v1/auth/unblock"
}