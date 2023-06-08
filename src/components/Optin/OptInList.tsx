import React, { useState } from "react";

import Box from "@mui/material/Box/Box";
import Button from "@mui/material/Button/Button";
import FormGroup from "@mui/material/FormGroup/FormGroup";
import OptIn, { OptInProps } from "./OptIn";

export type OptInListProps = {
  labels: {
    submit: string
  }
  optIns: Omit<OptInProps, "checked" | "onChange">[];
  onSubmit: () => void
};

const OptInList: React.FC<OptInListProps> = ({ labels, optIns, onSubmit }: OptInListProps) => {
  const [optInsStatus, setOptInsStatus] = useState( Object.assign({}, ...optIns.map((optIn) => ({[optIn.id]: false}))) )

  const handleChange = (id: string) => {
    setOptInsStatus({
      ...optInsStatus,
      [id]: !optInsStatus[id]
    })
  }

  return (
    <>
      <FormGroup>
        {optIns.map((optIn) => (
          <OptIn
            id={optIn.id}
            key={optIn.id}
            checked={optInsStatus[optIn.id]}
            onChange={handleChange}
            labels={optIn.labels}
            link={optIn.link}
          />
        ))}
      </FormGroup>
      <Box sx={{ display: "flex", justifyContent: "end", mt: 1 }}>
        <Button
          variant="outlined"
          disabled={!Object.values(optInsStatus).every((data) => data)}
          onClick={onSubmit}
        >
          {labels.submit}
        </Button>
      </Box>
    </>
  );
};

export default OptInList;
