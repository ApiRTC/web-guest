import { Box, SxProps, Theme, Typography } from "@mui/material";
import React from "react";

export type TextStepperProps = {
  activeStep: number;
  children: React.ReactNode;
  header: React.ReactNode;
  sx?: SxProps<Theme>
};

const TextStepper: React.FunctionComponent<TextStepperProps> = ({
  activeStep,
  children,
  header,
  sx = {}
}: TextStepperProps) => {
  console.log(React.Children.toArray(children));
  return (
  <Box sx={{...sx}}>
    <Box sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      {header}
      <Typography sx={{fontWeight: 500}}>{activeStep + 1}/{React.Children.toArray(children).length}</Typography>
    </Box>
    <Box sx={{
      padding: "16px 16px 0 16px"
    }}>
      {React.Children.toArray(children)[activeStep]}
    </Box>
  </Box>);
};

export default TextStepper;
