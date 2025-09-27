import { jsPDF } from "jspdf";

interface RetirementCertificate {
    retiredOn: string;
    tonnes: string ;
    beneficiary: string;
    description: string;
    beneficiaryAddress: string;
    project: string;
    transactionHash: string;
}

export const generateRetirementCertificate = async (data: RetirementCertificate) => {
    const doc = new jsPDF();

    // Set background color
    doc.setFillColor(240, 240, 240); // Light gray
    doc.rect(0, 0, 210, 297, "F"); // Full page background

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text("Carbon", 20, 24);
    doc.text("Retirement", 20, 34);
    doc.text("Certificate", 20, 45);

    // Carbon Quantity
    let fontSize = 87;
    doc.setFontSize(fontSize);
    let textWidth = doc.getTextWidth(data.tonnes);
    
    // Reduce font size if text is too wide
    while (textWidth > 60 && fontSize > 30) {
        fontSize -= 5;
        doc.setFontSize(fontSize);
        textWidth = doc.getTextWidth(data.tonnes);
    }
    
    doc.text(data.tonnes, 120, 38);

    // carbon title (centered below quantity)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    const titleWidth = doc.getTextWidth("TONES OF CO2 EMISSIONS");
    const centerX = 120 + textWidth/2 - titleWidth/2;
    doc.text("TONES OF CO2 EMISSIONS", centerX, 48);


    // Subtitle
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(`RETIRED ON ${data.retiredOn}`, 22, 58);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`RETIRED BY`, 22, 75);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`UniCarbon`, 22, 82);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`BENEFICIARY`, 22, 95);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`${data.beneficiary}`, 22, 102); //data.beneficiary
    // doc.text(`${data.beneficiary}`, 22, 102);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`BENEFICIARY ADDRESS`, 110, 95);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(data.beneficiaryAddress, 110, 102); //data.beneficiaryAddress

    // RETIREMENT TRANSACTION part
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`RETIREMENT MESSAGE`, 22, 120);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    // const text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    const splitText = doc.splitTextToSize(data.description, 170); // 170 is the maximum width in points
    doc.text(splitText, 22, 127); //


    // RETIREMENT TRANSACTION part
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`RETIREMENT TRANSACTION`, 22, 150);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(data.transactionHash, 22, 157); //data.RETIREMENT TRANSACTION

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.textWithLink('Kadena Chainweb', 22, 162, { url: `https://chain-20.evm-testnet-blockscout.chainweb.com/tx/${data.transactionHash}` });
    doc.setLineWidth(0.2);
    doc.line(22, 163, 42, 163); // Horizontal line under the text

    // Project Name
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`PROJECT`, 22, 175);
    
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(data.project, 22, 183);  //data.projectname


    
    // Save & Download
    doc.save("Retirement_Certificate.pdf");
};
