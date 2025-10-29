// // src/pages/Login.jsx
// import React, { useState } from "react";
// import {
//   Box,
//   TextField,
//   Button,
//   Typography,
//   FormControlLabel,
//   Checkbox,
//   IconButton,
//   InputAdornment,
//   Link as MuiLink,
//   Paper,
// } from "@mui/material";
// import { Visibility, VisibilityOff } from "@mui/icons-material";
// import { useNavigate, Link as RouterLink } from "react-router-dom";

// export default function LoginPage() {
//   const navigate = useNavigate();
//   const [values, setValues] = useState({
//     email: "",
//     password: "",
//     remember: true,
//     showPassword: false,
//   });
//   const [error, setError] = useState("");

//   const handleChange = (prop) => (e) => {
//     setValues((v) => ({
//       ...v,
//       [prop]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
//     }));
//     setError("");
//   };

//   const toggleShow = () =>
//     setValues((v) => ({ ...v, showPassword: !v.showPassword }));

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!values.email || !values.password) {
//       setError("Please fill in both email and password.");
//       return;
//     }

//     if (values.email === "admin@example.com" && values.password === "123456") {
//       localStorage.setItem("token", "fake-jwt");
//       navigate("/dashboard");
//     } else {
//       setError("Invalid email or password.");
//     }
//   };

//   return (
//    <Box
//   sx={{
//     minHeight: "100vh",
//     bgcolor: "#fff",
//     backgroundImage: {
//       xs: "none",
//       md: `url('/loginimages.svg')`, // your SVG file in public
//     },
//     backgroundRepeat: "no-repeat",
//     backgroundPosition: { md: "center" }, // keep centered
//     backgroundSize: { md: "90% auto", lg: "65% auto" }, // increases width, keeps height auto
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     px: { xs: 2, sm: 4, md: 6, lg: 8 },
//   }}
// >


//       {/* Login Card */}
//       <Paper
//         elevation={8}
//         sx={{
//           width: "100%",
//           maxWidth: 400, // reduced form width
//           borderRadius: 3,
//           p: { xs: 3, sm: 4, md: 5 },
//           backgroundColor: "rgba(255,255,255,0.95)", // slightly transparent
//           boxShadow: "0 12px 40px rgba(3,15,40,0.12)",
//           backdropFilter: "blur(6px)",
//         }}
//       >
//         <Box sx={{ width: "100%" }}>
//           {/* Logo */}
//           <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
//             <Box
//               component="img"
//               src="/logo.png"
//               alt="logo"
//               sx={{ height: 34, width: "auto" }}
//             />
//           </Box>

//           <Typography
//             variant="h4"
//             component="h1"
//             sx={{ fontWeight: 800, mb: 1, textAlign: "left" }}
//           >
//             Holla, <br /> Welcome Back
//           </Typography>

//           <Typography color="text.secondary" sx={{ mb: 3 }}>
//             Hey, welcome back to Safetynett
//           </Typography>

//           {/* Login Form */}
//           <Box component="form" onSubmit={handleSubmit} noValidate>
//             <TextField
//               label="Email address"
//               type="email"
//               value={values.email}
//               onChange={handleChange("email")}
//               fullWidth
//               margin="normal"
//               required
//               InputProps={{ sx: { borderRadius: 2 } }}
//             />

//             <TextField
//               label="Password"
//               type={values.showPassword ? "text" : "password"}
//               value={values.password}
//               onChange={handleChange("password")}
//               fullWidth
//               margin="normal"
//               required
//               InputProps={{
//                 endAdornment: (
//                   <InputAdornment position="end">
//                     <IconButton
//                       edge="end"
//                       onClick={toggleShow}
//                       aria-label="toggle password visibility"
//                     >
//                       {values.showPassword ? <VisibilityOff /> : <Visibility />}
//                     </IconButton>
//                   </InputAdornment>
//                 ),
//                 sx: { borderRadius: 2 },
//               }}
//             />

//             <Box
//               sx={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 mt: 1,
//               }}
//             >
//               <FormControlLabel
//                 control={
//                   <Checkbox
//                     checked={values.remember}
//                     onChange={handleChange("remember")}
//                   />
//                 }
//                 label="Remember me"
//                 sx={{ ml: 0 }}
//               />
//               <MuiLink
//                 component={RouterLink}
//                 to="/forgot-password"
//                 underline="hover"
//                 sx={{ color: "text.secondary" }}
//               >
//                 Forgot Password?
//               </MuiLink>
//             </Box>

//             {error && (
//               <Typography color="error" sx={{ mt: 1 }}>
//                 {error}
//               </Typography>
//             )}

//             <Button
//               type="submit"
//               variant="contained"
//               fullWidth
//               sx={{
//                 mt: 4,
//                 mb: 1,
//                 py: 1.25,
//                 borderRadius: 2,
//                 bgcolor: "#013a63",
//                 ":hover": { bgcolor: "#2a6f97" },
//               }}
//             >
//               Sign In
//             </Button>

//             <Typography
//               variant="body2"
//               color="text.secondary"
//               sx={{ mt: 2, textAlign: "center" }}
//             >
//               Don’t have an account?{" "}
//               <MuiLink
//                 component={RouterLink}
//                 to="/signup"
//                 sx={{ fontWeight: 700 }}
//               >
//                 Sign Up
//               </MuiLink>
//             </Typography>
//           </Box>
//         </Box>
//       </Paper>
//     </Box>
//   );
// }
import React, { useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Link as MuiLink,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    email: "",
    password: "",
    remember: true,
    showPassword: false,
  });
  const [error, setError] = useState("");

  const handleChange = (prop) => (e) => {
    setValues((v) => ({
      ...v,
      [prop]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
    setError("");
  };

  const toggleShow = () =>
    setValues((v) => ({ ...v, showPassword: !v.showPassword }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!values.email || !values.password) {
      setError("Please fill in both email and password.");
      return;
    }

    // Simulated login
    if (values.email === "admin@example.com" && values.password === "123456") {
      localStorage.setItem("token", "fake-jwt");
      navigate("/dashboard");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 4, md: 8, lg: 12 },
      }}
    >
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        sx={{
          flexGrow: 1,
          maxWidth: "1600px", // controls total page width
        }}
      >
        {/* LEFT: Form */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: { xs: 2, sm: 4, md: 6 },
            py: { xs: 4, md: 0 },
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 500, mx: "auto" }}>
            {/* logo */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 3,
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="logo"
                sx={{ height: 36, width: "auto" }}
              />
            </Box>

            {/* Heading */}
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 800,
                mb: 1.5,
                lineHeight: 1.04,
              }}
            >
              Holla, <br /> Welcome Back
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Hey, welcome back to Safetynett
            </Typography>

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                label="Email address"
                type="email"
                value={values.email}
                onChange={handleChange("email")}
                fullWidth
                margin="normal"
                required
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              <TextField
                label="Password"
                type={values.showPassword ? "text" : "password"}
                value={values.password}
                onChange={handleChange("password")}
                fullWidth
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={toggleShow}
                        aria-label="toggle password visibility"
                      >
                        {values.showPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.remember}
                      onChange={handleChange("remember")}
                    />
                  }
                  label="Remember me"
                  sx={{ ml: 0 }}
                />
                <MuiLink
                  component={RouterLink}
                  to="/forgot-password"
                  underline="hover"
                  sx={{ color: "text.secondary" }}
                >
                  Forgot Password?
                </MuiLink>
              </Box>

              {error && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mt: 4,
                  mb: 1,
                  py: 1.25,
                  borderRadius: 2,
                  bgcolor: "#013a63",
                  ":hover": { bgcolor: "#2a6f97" },
                }}
              >
                Sign In
              </Button>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2, textAlign: "center" }}
              >
                Don’t have an account?{" "}
                <MuiLink
                  component={RouterLink}
                  to="/signup"
                  sx={{ fontWeight: 700 }}
                >
                  Sign Up
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* RIGHT: Illustration */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2, sm: 4, md: 6 },
            py: { xs: 4, md: 0 },
          }}
        >
          <Box
            component="img"
            src="/loginimage.svg"
            alt="Login illustration"
            sx={{
              width: "100%",
              maxWidth: 2000, // larger illustration
              height: "auto",
              objectFit: "contain",
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

