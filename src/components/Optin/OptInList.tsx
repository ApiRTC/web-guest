import React, { useState } from "react";

import Box from "@mui/material/Box/Box";
import Button from "@mui/material/Button/Button";
import FormGroup from "@mui/material/FormGroup/FormGroup";
import OptIn, { OptInProps } from "./OptIn";

export type OptInListProps = {
  labels: {
    submit: string
  }
  optins: Omit<OptInProps, "checked" | "onChange">[];
  onSubmit: () => void
};

const OptInList: React.FC<OptInListProps> = ({ labels, optins, onSubmit }: OptInListProps) => {
  const [optinsStatus, setOptinsStatus] = useState( Object.assign({}, ...optins.map((optin) => ({[optin.id]: false}))) )

  const handleChange = (id: string) => {
    setOptinsStatus({
      ...optinsStatus,
      [id]: !optinsStatus[id]
    })
  }

  return (
    <>
      <FormGroup>
        {optins.map((optin) => (
          <OptIn
            id={optin.id}
            key={optin.id}
            checked={optinsStatus[optin.id]}
            onChange={handleChange}
            labels={optin.labels}
            link={optin.link}
          />
        ))}
      </FormGroup>
      <Box sx={{ display: "flex", justifyContent: "end", mt: 1 }}>
        <Button
          variant="contained"
          disabled={!Object.values(optinsStatus).every((data) => data)}
          onClick={onSubmit}
        >
          {labels.submit}
        </Button>
      </Box>
    </>
  );
};

export default OptInList;
