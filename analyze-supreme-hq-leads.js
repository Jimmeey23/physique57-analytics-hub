// Supreme HQ Leads Data Analysis - Conversion Discrepancy Investigation
// This script analyzes the leads data to identify inconsistencies between conversionStatus and stage fields

const SPREADSHEET_ID = "1Cm2XF83jdiaDB8aKu_HYNbot8cxZmz2oORKh8_WkI8g";

async function getGoogleAccessToken() {
  // For this analysis, we'll use a mock token or read from environment
  // In production, this would use proper OAuth flow
  return process.env.GOOGLE_ACCESS_TOKEN || 'mock-token-for-analysis';
}

function parseDate(dateString) {
  if (!dateString || dateString.trim() === '' || dateString === '-') return '';
  
  try {
    let parsedDate;
    const now = new Date();
    
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          parsedDate = new Date(year, month - 1, day);
        }
      }
    } else if (dateString.includes('-')) {
      parsedDate = new Date(dateString);
    } else {
      parsedDate = new Date(dateString);
    }
    
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return '';
    }
    
    if (parsedDate > now || parsedDate.getFullYear() < 2020) {
      return '';
    }
    
    return parsedDate.toISOString();
  } catch (error) {
    return '';
  }
}

const safeGet = (row, index) => {
  return row && row[index] !== undefined && row[index] !== null ? String(row[index]).trim() : '';
};

const safeGetNumber = (row, index) => {
  let value = safeGet(row, index);
  if (!value) return 0;
  if (value.includes('/') || value.includes('-')) return 0;
  value = value.replace(/[₹$,]/g, '');
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const safeGetInt = (row, index) => {
  const value = safeGet(row, index);
  if (!value) return 0;
  if (value.includes('/') || value.includes('-')) return 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
};

function isSupremeHQ(center) {
  if (!center) return false;
  const centerLower = center.toLowerCase();
  return centerLower.includes('supreme') || centerLower.includes('bandra');
}

function isConversionStage(stage) {
  if (!stage) return false;
  const stageLower = stage.toLowerCase();
  return stageLower.includes('membership sold') || 
         stageLower.includes('converted') ||
         stageLower === 'membership sold' ||
         stageLower === 'converted';
}

async function analyzeSupremeHQLeads() {
  try {
    console.log('🔍 Starting Supreme HQ Leads Analysis...\n');
    
    // For this analysis, we'll simulate the data fetch
    // In a real scenario, you'd uncomment the fetch call below
    
    /*
    const accessToken = await getGoogleAccessToken();
    const sheetName = encodeURIComponent('◉ Leads');
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?alt=json`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch leads data: ${response.statusText}`);
    }

    const result = await response.json();
    const rows = result.values || [];
    */
    
    // Mock data structure for analysis (replace with actual data fetch above)
    console.log('⚠️  Note: This is a mock analysis structure. To run actual analysis:');
    console.log('1. Set GOOGLE_ACCESS_TOKEN environment variable');
    console.log('2. Uncomment the fetch call above');
    console.log('3. Comment out the mock data below\n');
    
    // Mock data structure showing the expected format
    const mockRows = [
      // Headers (row 0)
      ['id', 'fullName', 'phone', 'email', 'createdAt', 'sourceId', 'source', 'memberId', 'convertedToCustomerAt', 'stage', 'associate', 'remarks', 'followUp1Date', 'followUpComments1', 'followUp2Date', 'followUpComments2', 'followUp3Date', 'followUpComments3', 'followUp4Date', 'followUpComments4', 'center', 'classType', 'hostId', 'status', 'channel', 'period', 'purchasesMade', 'ltv', 'visits', 'trialStatus', 'conversionStatus', 'retentionStatus'],
      // Mock data rows showing the discrepancy pattern
      ['LEAD001', 'John Doe', '9876543210', 'john@email.com', '15/11/2024', 'SRC001', 'Trial Class', 'MEM001', '20/11/2024', 'Membership Sold', 'Associate1', 'Converted successfully', '', '', '', '', '', '', '', '', 'Supreme HQ, Bandra', 'Barre', 'HOST001', 'Active', 'Walk-in', 'Nov 2024', 2, 15000, 5, 'Completed', 'Not Converted', 'Active'],
      ['LEAD002', 'Jane Smith', '9876543211', 'jane@email.com', '16/11/2024', 'SRC002', 'Referral', '', '', 'Membership Sold', 'Associate2', 'Great conversion', '', '', '', '', '', '', '', '', 'Supreme HQ, Bandra', 'Cardio', 'HOST002', 'Active', 'Referral', 'Nov 2024', 1, 12000, 3, 'Completed', 'Lost', 'Active'],
      ['LEAD003', 'Bob Wilson', '9876543212', 'bob@email.com', '17/11/2024', 'SRC003', 'Online', 'MEM003', '22/11/2024', 'Trial Completed', 'Associate1', 'Converted to member', '', '', '', '', '', '', '', '', 'Supreme HQ, Bandra', 'Barre', 'HOST001', 'Active', 'Online', 'Nov 2024', 3, 18000, 7, 'Completed', 'Converted', 'Active'],
      ['LEAD004', 'Alice Brown', '9876543213', 'alice@email.com', '18/11/2024', 'SRC004', 'Walk-in', '', '', 'Membership Sold', 'Associate3', 'Quick conversion', '', '', '', '', '', '', '', '', 'Supreme HQ, Bandra', 'Yoga', 'HOST003', 'Active', 'Walk-in', 'Nov 2024', 1, 10000, 2, 'Completed', 'Not Converted', 'Active'],
      ['LEAD005', 'Charlie Green', '9876543214', 'charlie@email.com', '19/11/2024', 'SRC005', 'Trial Class', '', '', 'Membership Sold', 'Associate2', 'Excellent lead', '', '', '', '', '', '', '', '', 'Supreme HQ, Bandra', 'Pilates', 'HOST002', 'Active', 'Trial', 'Nov 2024', 2, 14000, 4, 'Completed', 'Lost', 'Active'],
      // Non-Supreme HQ leads for comparison
      ['LEAD006', 'David White', '9876543215', 'david@email.com', '20/11/2024', 'SRC006', 'Online', 'MEM006', '25/11/2024', 'Converted', 'Associate4', 'Standard conversion', '', '', '', '', '', '', '', '', 'Kwality House', 'Barre', 'HOST004', 'Active', 'Online', 'Nov 2024', 1, 16000, 3, 'Completed', 'Converted', 'Active'],
    ];
    
    console.log('📊 Processing leads data...\n');
    
    // Process each row
    const leadsData = mockRows.slice(1).map((row, index) => {
      try {
        if (!row || row.length === 0) {
          return null;
        }

        return {
          id: safeGet(row, 0),
          fullName: safeGet(row, 1),
          phone: safeGet(row, 2),
          email: safeGet(row, 3),
          createdAt: parseDate(safeGet(row, 4)),
          sourceId: safeGet(row, 5),
          source: safeGet(row, 6),
          memberId: safeGet(row, 7),
          convertedToCustomerAt: parseDate(safeGet(row, 8)),
          stage: safeGet(row, 9),
          associate: safeGet(row, 10),
          remarks: safeGet(row, 11),
          center: safeGet(row, 20),
          conversionStatus: safeGet(row, 30),
          ltv: safeGetNumber(row, 27),
          visits: safeGetInt(row, 28),
        };
      } catch (rowError) {
        console.error(`Error processing row ${index + 1}:`, rowError);
        return null;
      }
    }).filter(item => item !== null);

    // Filter for Supreme HQ leads only
    const supremeHQLeads = leadsData.filter(lead => isSupremeHQ(lead.center));
    
    console.log(`🏢 Found ${supremeHQLeads.length} Supreme HQ leads\n`);
    
    // Analysis 1: Leads with conversionStatus === 'Converted'
    const convertedByStatus = supremeHQLeads.filter(lead => lead.conversionStatus === 'Converted');
    console.log(`✅ Leads with conversionStatus === 'Converted': ${convertedByStatus.length}`);
    convertedByStatus.forEach(lead => {
      console.log(`   - ${lead.fullName} (${lead.id}): Stage = "${lead.stage}", Status = "${lead.conversionStatus}"`);
    });
    console.log();
    
    // Analysis 2: Leads with stage indicating membership sales
    const convertedByStage = supremeHQLeads.filter(lead => isConversionStage(lead.stage));
    console.log(`🎯 Leads with conversion-indicating stages: ${convertedByStage.length}`);
    convertedByStage.forEach(lead => {
      console.log(`   - ${lead.fullName} (${lead.id}): Stage = "${lead.stage}", Status = "${lead.conversionStatus}"`);
    });
    console.log();
    
    // Analysis 3: Identify inconsistencies
    const inconsistentLeads = supremeHQLeads.filter(lead => {
      const hasConversionStage = isConversionStage(lead.stage);
      const hasConversionStatus = lead.conversionStatus === 'Converted';
      return hasConversionStage !== hasConversionStatus; // XOR - they should match
    });
    
    console.log(`⚠️  INCONSISTENT LEADS FOUND: ${inconsistentLeads.length}`);
    console.log('   (Leads where stage and conversionStatus don\'t align)\n');
    
    inconsistentLeads.forEach(lead => {
      const hasConversionStage = isConversionStage(lead.stage);
      const hasConversionStatus = lead.conversionStatus === 'Converted';
      
      console.log(`❌ ${lead.fullName} (${lead.id}):`);
      console.log(`   Stage: "${lead.stage}" → ${hasConversionStage ? 'INDICATES CONVERSION' : 'NO CONVERSION INDICATED'}`);
      console.log(`   Status: "${lead.conversionStatus}" → ${hasConversionStatus ? 'CONVERTED' : 'NOT CONVERTED'}`);
      console.log(`   LTV: ₹${lead.ltv}, Visits: ${lead.visits}`);
      console.log(`   Associate: ${lead.associate}`);
      console.log();
    });
    
    // Analysis 4: Summary statistics
    console.log('📈 SUMMARY FOR SUPREME HQ:');
    console.log(`   Total Leads: ${supremeHQLeads.length}`);
    console.log(`   Converted by Status: ${convertedByStatus.length}`);
    console.log(`   Converted by Stage: ${convertedByStage.length}`);
    console.log(`   Data Inconsistencies: ${inconsistentLeads.length}`);
    console.log();
    
    // Analysis 5: Specific problematic patterns
    const membershipSoldButNotConverted = supremeHQLeads.filter(lead => 
      lead.stage === 'Membership Sold' && lead.conversionStatus !== 'Converted'
    );
    
    console.log(`🚨 CRITICAL ISSUE - "Membership Sold" but status ≠ "Converted": ${membershipSoldButNotConverted.length}`);
    membershipSoldButNotConverted.forEach(lead => {
      console.log(`   - ${lead.fullName}: Stage = "${lead.stage}", Status = "${lead.conversionStatus}"`);
    });
    console.log();
    
    const convertedButNoMembershipStage = supremeHQLeads.filter(lead => 
      lead.conversionStatus === 'Converted' && !isConversionStage(lead.stage)
    );
    
    console.log(`🔍 Status "Converted" but stage doesn't indicate conversion: ${convertedButNoMembershipStage.length}`);
    convertedButNoMembershipStage.forEach(lead => {
      console.log(`   - ${lead.fullName}: Stage = "${lead.stage}", Status = "${lead.conversionStatus}"`);
    });
    console.log();
    
    // Analysis 6: Recommendations
    console.log('🎯 RECOMMENDATIONS:');
    console.log('1. Data Cleanup: Review and standardize the', inconsistentLeads.length, 'inconsistent records');
    console.log('2. Process Review: Ensure stage updates trigger conversionStatus updates');
    console.log('3. Training: Educate associates on proper data entry for conversion tracking');
    console.log('4. Validation: Implement data validation rules to prevent future inconsistencies');
    console.log();
    
    console.log('✅ Analysis Complete!');
    
    return {
      totalLeads: supremeHQLeads.length,
      convertedByStatus: convertedByStatus.length,
      convertedByStage: convertedByStage.length,
      inconsistentLeads: inconsistentLeads.length,
      issues: {
        membershipSoldButNotConverted: membershipSoldButNotConverted.length,
        convertedButNoMembershipStage: convertedButNoMembershipStage.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error in analysis:', error);
    return null;
  }
}

// Export for use in Node.js or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeSupremeHQLeads, isSupremeHQ, isConversionStage };
} else {
  // Run analysis if called directly
  analyzeSupremeHQLeads().then(result => {
    if (result) {
      console.log('\n📋 FINAL RESULTS:', JSON.stringify(result, null, 2));
    }
  });
}