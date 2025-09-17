#!/usr/bin/env node

/**
 * Demo script for RevelAi Health Backend
 * 
 * This script demonstrates how to:
 * 1. Create a journey
 * 2. Trigger the journey for a patient
 * 3. Monitor the journey execution
 * 
 * Make sure the server is running on localhost:3000 before running this script.
 * 
 * Usage: node demo.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Sample journey definition
const sampleJourney = {
  name: 'Hip Replacement Recovery Journey',
  start_node_id: 'welcome',
  nodes: [
    {
      id: 'welcome',
      type: 'MESSAGE',
      message: 'Welcome to your hip replacement recovery journey! We are here to support you.',
      next_node_id: 'age_check'
    },
    {
      id: 'age_check',
      type: 'CONDITIONAL',
      condition: {
        field: 'age',
        operator: 'gte',
        value: 65
      },
      on_true_next_node_id: 'senior_program',
      on_false_next_node_id: 'standard_program'
    },
    {
      id: 'senior_program',
      type: 'MESSAGE',
      message: 'You have been enrolled in our Senior Care Program with additional support.',
      next_node_id: 'delay_before_followup'
    },
    {
      id: 'standard_program',
      type: 'MESSAGE',
      message: 'You have been enrolled in our Standard Recovery Program.',
      next_node_id: 'delay_before_followup'
    },
    {
      id: 'delay_before_followup',
      type: 'DELAY',
      duration_seconds: 5,
      next_node_id: 'followup_message'
    },
    {
      id: 'followup_message',
      type: 'MESSAGE',
      message: 'How are you feeling today? Remember to take your medication as prescribed.',
      next_node_id: null
    }
  ]
};

// Sample patient context
const samplePatient = {
  id: 'patient-demo-001',
  age: 72,
  language: 'en',
  condition: 'liver_replacement'
};

async function runDemo() {
  try {
    console.log('🚀 RevelAi Health Backend Demo');
    console.log('================================\n');

    // Step 1: Create a journey
    console.log('📋 Step 1: Creating a journey...');
    const createJourneyResponse = await axios.post(`${BASE_URL}/journeys`, sampleJourney);
    const journeyId = createJourneyResponse.data.journeyId;
    console.log(`✅ Journey created with ID: ${journeyId}\n`);

    // Step 2: Trigger the journey for a patient
    console.log('🎯 Step 2: Triggering journey for patient...');
    const triggerResponse = await axios.post(`${BASE_URL}/journeys/${journeyId}/trigger`, samplePatient);
    const runId = triggerResponse.data.runId;
    console.log(`✅ Journey triggered with Run ID: ${runId}`);
    console.log(`📍 Monitor URL: ${triggerResponse.headers.location}\n`);

    // Step 3: Monitor the journey execution
    console.log('👀 Step 3: Monitoring journey execution...');
    
    let completed = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      try {
        const statusResponse = await axios.get(`${BASE_URL}/journeys/runs/${runId}`);
        const status = statusResponse.data;
        
        console.log(`📊 Status Check #${attempts}:`);
        console.log(`   Status: ${status.status}`);
        console.log(`   Current Node: ${status.currentNodeId || 'None'}`);
        console.log(`   Patient: ${status.patientContext.id} (Age: ${status.patientContext.age})`);
        
        if (status.status === 'completed') {
          completed = true;
          console.log(`✅ Journey completed successfully!`);
          if (status.completedAt) {
            console.log(`   Completed at: ${new Date(status.completedAt).toLocaleString()}`);
          }
        } else if (status.status === 'failed') {
          completed = true;
          console.log(`❌ Journey failed.`);
        } else {
          console.log(`   ⏳ Still in progress...`);
        }
        
        console.log('');
        
        if (!completed) {
          // Wait 2 seconds before next check
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking status: ${error.message}`);
        break;
      }
    }

    if (!completed && attempts >= maxAttempts) {
      console.log('⏰ Reached maximum monitoring attempts. Journey may still be running.');
    }

    console.log('\n🎉 Demo completed!');
    console.log('\n💡 Tips:');
    console.log('   - Check the server logs to see the MESSAGE and DELAY node executions');
    console.log('   - Try different patient ages to see conditional branching');
    console.log('   - Visit http://localhost:3000/api-docs for interactive API documentation');
    console.log('   - Use Swagger UI to test all endpoints with a user-friendly interface');
    console.log('   - Explore the example journey definitions in examples/sample-journeys.json');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    console.log('\n💡 Make sure the server is running with: npm run dev');
  }
}

// Check if axios is available
try {
  require('axios');
} catch (error) {
  console.error('❌ axios is required for this demo. Install it with: npm install axios');
  process.exit(1);
}

// Run the demo
runDemo();